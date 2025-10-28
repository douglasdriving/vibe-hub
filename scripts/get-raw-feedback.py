#!/usr/bin/env python3
"""
Get raw pending feedback only (excludes archived feedback).
This reduces token usage when Claude reads feedback data.

Usage:
  python scripts/get-raw-feedback.py

Output: JSON array of pending feedback items
"""

import json
import sys
from pathlib import Path

def get_raw_feedback(vibe_dir):
    """Read and return only pending feedback"""
    feedback_path = vibe_dir / "feedback.json"

    if not feedback_path.exists():
        return []

    with open(feedback_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Return only pending feedback (not completed)
    all_feedback = data.get("feedback", [])
    pending_feedback = [f for f in all_feedback if f.get("status") == "pending"]

    return pending_feedback

if __name__ == "__main__":
    # Default to current project's .vibe directory
    project_root = Path(__file__).parent.parent
    vibe_dir = project_root / ".vibe"

    if not vibe_dir.exists():
        print(json.dumps({"error": ".vibe directory not found"}), file=sys.stderr)
        sys.exit(1)

    feedback = get_raw_feedback(vibe_dir)
    print(json.dumps(feedback, indent=2, ensure_ascii=False))
