#!/usr/bin/env python3
"""
Migration script to split completed issues into a separate archive file.
This reduces the size of issues.json that Claude needs to read during workflows.
"""

import json
import sys
from pathlib import Path

def migrate_issues(vibe_dir):
    """Split issues.json into pending (issues.json) and completed (issues-archive.json)"""

    issues_path = vibe_dir / "issues.json"
    archive_path = vibe_dir / "issues-archive.json"

    # Read current issues file
    if not issues_path.exists():
        print(f"Error: {issues_path} not found")
        return False

    with open(issues_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    all_issues = data.get("issues", [])

    # Split into pending and completed
    pending_issues = [issue for issue in all_issues if issue.get("status") != "completed"]
    completed_issues = [issue for issue in all_issues if issue.get("status") == "completed"]

    print(f"Found {len(all_issues)} total issues:")
    print(f"  - {len(pending_issues)} pending")
    print(f"  - {len(completed_issues)} completed")

    # Write pending issues back to issues.json
    with open(issues_path, 'w', encoding='utf-8') as f:
        json.dump({"issues": pending_issues}, f, indent=2, ensure_ascii=False)
    print(f"\nWrote {len(pending_issues)} pending issues to {issues_path}")

    # Write completed issues to archive
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump({"issues": completed_issues}, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(completed_issues)} completed issues to {archive_path}")

    return True

if __name__ == "__main__":
    # Default to current project's .vibe directory
    project_root = Path(__file__).parent.parent
    vibe_dir = project_root / ".vibe"

    if not vibe_dir.exists():
        print(f"Error: .vibe directory not found at {vibe_dir}")
        sys.exit(1)

    print(f"Migrating issues in: {vibe_dir}\n")

    if migrate_issues(vibe_dir):
        print("\n✓ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Migration failed")
        sys.exit(1)
