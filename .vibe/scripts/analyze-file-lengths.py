#!/usr/bin/env python3
"""
Analyze file lengths in the codebase to identify refactoring opportunities.
This helps Claude proactively identify files that exceed reasonable length limits.

Usage (from project root):
  python .vibe/scripts/analyze-file-lengths.py

Output: Report of files over 500 lines, sorted by size
"""

import os
import sys
import io
from pathlib import Path
from collections import defaultdict

# Force UTF-8 encoding for stdout on Windows to handle Unicode characters
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def count_code_lines(file_path):
    """Count lines of code, excluding blank lines and comments"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        code_lines = 0
        total_lines = len(lines)
        in_multiline_comment = False

        for line in lines:
            stripped = line.strip()

            # Skip blank lines
            if not stripped:
                continue

            # Handle multiline comments (/* */ for JS/TS/Rust, """ for Python)
            if '/*' in stripped:
                in_multiline_comment = True
            if '*/' in stripped:
                in_multiline_comment = False
                continue
            if in_multiline_comment:
                continue

            # Skip single-line comments
            if stripped.startswith('//') or stripped.startswith('#'):
                continue

            code_lines += 1

        return total_lines, code_lines
    except Exception as e:
        return 0, 0

def analyze_directory(root_dir, extensions, max_lines=500):
    """Scan directories and analyze file lengths"""
    files_data = []

    for ext in extensions:
        pattern = f"**/*{ext}"
        for file_path in root_dir.glob(pattern):
            # Skip node_modules, dist, build, target directories
            if any(part in file_path.parts for part in ['node_modules', 'dist', 'build', 'target', '.git']):
                continue

            total_lines, code_lines = count_code_lines(file_path)
            if total_lines > 0:
                relative_path = file_path.relative_to(root_dir)
                files_data.append({
                    'path': str(relative_path),
                    'total_lines': total_lines,
                    'code_lines': code_lines,
                    'extension': ext
                })

    # Sort by total lines descending
    files_data.sort(key=lambda x: x['total_lines'], reverse=True)

    # Split into files over and under the limit
    over_limit = [f for f in files_data if f['total_lines'] > max_lines]
    under_limit = [f for f in files_data if f['total_lines'] <= max_lines]

    return over_limit, under_limit, files_data

def print_report(over_limit, under_limit, all_files, max_lines):
    """Print analysis report"""
    print("=" * 80)
    print("FILE LENGTH ANALYSIS REPORT")
    print("=" * 80)
    print()

    if over_limit:
        print(f"WARNING: FILES OVER {max_lines} LINES (NEED REFACTORING):")
        print("-" * 80)
        for file in over_limit:
            print(f"  {file['total_lines']:4d} lines  |  {file['code_lines']:4d} code  |  {file['path']}")
        print()
        print(f"Total files needing refactoring: {len(over_limit)}")
        print()
    else:
        print(f"OK: No files exceed {max_lines} lines")
        print()

    # Summary by extension
    ext_stats = defaultdict(lambda: {'count': 0, 'total_lines': 0, 'avg_lines': 0})
    for file in all_files:
        ext = file['extension']
        ext_stats[ext]['count'] += 1
        ext_stats[ext]['total_lines'] += file['total_lines']

    for ext, stats in ext_stats.items():
        stats['avg_lines'] = stats['total_lines'] // stats['count'] if stats['count'] > 0 else 0

    print("SUMMARY BY FILE TYPE:")
    print("-" * 80)
    for ext, stats in sorted(ext_stats.items()):
        print(f"  {ext:8s}  |  {stats['count']:3d} files  |  avg {stats['avg_lines']:3d} lines")
    print()

    # Longest files
    print("TOP 10 LONGEST FILES:")
    print("-" * 80)
    for file in all_files[:10]:
        print(f"  {file['total_lines']:4d} lines  |  {file['path']}")
    print()

if __name__ == "__main__":
    # Script is in .vibe/scripts/, so project root is two levels up
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent

    # Define source directories to analyze
    src_dirs = [
        project_root / "src",
        project_root / "src-tauri" / "src"
    ]

    # Extensions to analyze
    extensions = ['.ts', '.tsx', '.js', '.jsx', '.rs']

    all_over_limit = []
    all_under_limit = []
    all_files = []

    for src_dir in src_dirs:
        if src_dir.exists():
            over, under, files = analyze_directory(src_dir, extensions)
            all_over_limit.extend(over)
            all_under_limit.extend(under)
            all_files.extend(files)

    # Re-sort combined results
    all_over_limit.sort(key=lambda x: x['total_lines'], reverse=True)
    all_files.sort(key=lambda x: x['total_lines'], reverse=True)

    print_report(all_over_limit, all_under_limit, all_files, max_lines=500)

    # Exit with error code if files need refactoring
    if all_over_limit:
        print(f"WARNING: {len(all_over_limit)} file(s) need refactoring to stay under 500 lines")
        sys.exit(1)
    else:
        print("OK: All files are within acceptable length limits")
        sys.exit(0)
