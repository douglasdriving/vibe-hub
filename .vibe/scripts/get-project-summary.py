#!/usr/bin/env python3
"""
Get high-level project summary without full issue/feedback data.
This provides quick stats for Claude without loading large files.

Usage (from project root):
  python .vibe/scripts/get-project-summary.py

Output: JSON summary with counts and status
"""

import json
import sys
import io
from pathlib import Path

# Force UTF-8 encoding for stdout on Windows to handle Unicode characters
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def get_project_summary(vibe_dir):
    """Generate a high-level project summary"""
    summary = {
        "pending_issues": 0,
        "completed_issues": 0,
        "pending_feedback": 0,
        "archived_feedback": 0,
        "status": "unknown",
        "name": "Unknown",
        "platform": "Unknown"
    }

    # Count pending issues
    issues_path = vibe_dir / "issues.json"
    if issues_path.exists():
        with open(issues_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            summary["pending_issues"] = len(data.get("issues", []))

    # Count archived issues
    archive_path = vibe_dir / "issues-archive.json"
    if archive_path.exists():
        with open(archive_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            summary["completed_issues"] = len(data.get("issues", []))

    # Count pending feedback
    feedback_path = vibe_dir / "feedback.json"
    if feedback_path.exists():
        with open(feedback_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_feedback = data.get("feedback", [])
            summary["pending_feedback"] = len([f for f in all_feedback if f.get("status") == "pending"])

    # Count archived feedback
    feedback_archive_path = vibe_dir / "feedback-archive.json"
    if feedback_archive_path.exists():
        with open(feedback_archive_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            summary["archived_feedback"] = len(data.get("feedback", []))

    # Read metadata for project info
    metadata_path = vibe_dir / "metadata.md"
    if metadata_path.exists():
        with open(metadata_path, 'r', encoding='utf-8') as f:
            content = f.read()
            for line in content.split('\n'):
                if line.startswith('Name: '):
                    summary["name"] = line.replace('Name: ', '').strip()
                elif line.startswith('Status: '):
                    summary["status"] = line.replace('Status: ', '').strip()
                elif line.startswith('Platform: '):
                    summary["platform"] = line.replace('Platform: ', '').strip()

    return summary

if __name__ == "__main__":
    # Project's .vibe directory (script is in .vibe/scripts/)
    script_dir = Path(__file__).parent
    vibe_dir = script_dir.parent

    if not vibe_dir.exists():
        print(json.dumps({"error": ".vibe directory not found"}), file=sys.stderr)
        sys.exit(1)

    summary = get_project_summary(vibe_dir)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
