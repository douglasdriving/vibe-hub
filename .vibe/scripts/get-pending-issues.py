#!/usr/bin/env python3
"""
Get pending issues only (excludes completed issues from archive).
This reduces token usage when Claude reads issue data.

Usage (from project root):
  python .vibe/scripts/get-pending-issues.py

Output: JSON array of pending issues
"""

import json
import sys
from pathlib import Path

def get_pending_issues(vibe_dir):
    """Read and return only pending issues"""
    issues_path = vibe_dir / "issues.json"

    if not issues_path.exists():
        return []

    with open(issues_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get("issues", [])

if __name__ == "__main__":
    # Project's .vibe directory (script is in .vibe/scripts/)
    script_dir = Path(__file__).parent
    vibe_dir = script_dir.parent

    if not vibe_dir.exists():
        print(json.dumps({"error": ".vibe directory not found"}), file=sys.stderr)
        sys.exit(1)

    issues = get_pending_issues(vibe_dir)
    print(json.dumps(issues, indent=2, ensure_ascii=False))
