use crate::models::{Issue, IssueFile, NewIssue, UpdateIssue, FeedbackFile};
use std::fs;
use std::path::Path;
use uuid::Uuid;
use chrono;

const VIBE_DIR: &str = ".vibe";
const ISSUES_FILE: &str = "issues.json";
const ISSUES_ARCHIVE_FILE: &str = "issues-archive.json";
const FEEDBACK_ARCHIVE_FILE: &str = "feedback-archive.json";

fn read_issues_file(project_path: &Path) -> Result<IssueFile, String> {
    let issues_path = project_path.join(VIBE_DIR).join(ISSUES_FILE);

    if !issues_path.exists() {
        return Ok(IssueFile::default());
    }

    let contents = fs::read_to_string(&issues_path)
        .map_err(|e| format!("Failed to read issues file: {}", e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse issues file: {}", e))
}

fn read_issues_archive_file(project_path: &Path) -> Result<IssueFile, String> {
    let archive_path = project_path.join(VIBE_DIR).join(ISSUES_ARCHIVE_FILE);

    if !archive_path.exists() {
        return Ok(IssueFile::default());
    }

    let contents = fs::read_to_string(&archive_path)
        .map_err(|e| format!("Failed to read issues archive file: {}", e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse issues archive file: {}", e))
}

fn write_issues_file(project_path: &Path, issues_file: &IssueFile) -> Result<(), String> {
    let vibe_dir = project_path.join(VIBE_DIR);
    let issues_path = vibe_dir.join(ISSUES_FILE);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(issues_file)
        .map_err(|e| format!("Failed to serialize issues: {}", e))?;

    fs::write(&issues_path, json)
        .map_err(|e| format!("Failed to write issues file: {}", e))?;

    Ok(())
}

fn write_issues_archive_file(project_path: &Path, issues_file: &IssueFile) -> Result<(), String> {
    let vibe_dir = project_path.join(VIBE_DIR);
    let archive_path = vibe_dir.join(ISSUES_ARCHIVE_FILE);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(issues_file)
        .map_err(|e| format!("Failed to serialize issues archive: {}", e))?;

    fs::write(&archive_path, json)
        .map_err(|e| format!("Failed to write issues archive file: {}", e))?;

    Ok(())
}

fn read_archived_feedback(project_path: &Path) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_ARCHIVE_FILE);

    if !feedback_path.exists() {
        return Ok(FeedbackFile::default());
    }

    let contents = fs::read_to_string(&feedback_path)
        .map_err(|e| format!("Failed to read feedback archive file: {}", e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse feedback archive file: {}", e))
}

fn write_archived_feedback(project_path: &Path, feedback_file: &FeedbackFile) -> Result<(), String> {
    let vibe_dir = project_path.join(VIBE_DIR);
    let feedback_path = vibe_dir.join(FEEDBACK_ARCHIVE_FILE);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(feedback_file)
        .map_err(|e| format!("Failed to serialize feedback archive: {}", e))?;

    fs::write(&feedback_path, json)
        .map_err(|e| format!("Failed to write feedback archive file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_issues(project_path: String) -> Result<Vec<Issue>, String> {
    let path = Path::new(&project_path);

    // Read both pending and archived issues
    let pending_file = read_issues_file(path)?;
    let archive_file = read_issues_archive_file(path)?;

    // Merge all issues
    let mut issues = pending_file.issues;
    issues.extend(archive_file.issues);

    // Sort by priority (1 = highest priority)
    issues.sort_by(|a, b| a.priority.cmp(&b.priority));

    Ok(issues)
}

#[tauri::command]
pub async fn add_issue(
    project_path: String,
    issue: NewIssue,
) -> Result<Issue, String> {
    let path = Path::new(&project_path);
    let mut issues_file = read_issues_file(path)?;

    let new_issue = Issue {
        id: Uuid::new_v4().to_string(),
        original_feedback_id: issue.original_feedback_id,
        title: issue.title,
        description: issue.description,
        subtasks: issue.subtasks,
        time_estimate: issue.time_estimate,
        complexity: issue.complexity,
        priority: issue.priority,
        status: issue.status,
        created_at: chrono::Utc::now().to_rfc3339(),
        completed_at: None,
        review_notes: None,
        bug_report: None,
        last_user_critique: None,
    };

    issues_file.issues.push(new_issue.clone());
    write_issues_file(path, &issues_file)?;

    Ok(new_issue)
}

#[tauri::command]
pub async fn update_issue(
    project_path: String,
    issue_id: String,
    updates: UpdateIssue,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut pending_file = read_issues_file(path)?;
    let mut archive_file = read_issues_archive_file(path)?;

    // Try to find issue in pending file first
    let mut issue_in_pending = pending_file.issues.iter_mut()
        .find(|i| i.id == issue_id);

    // If not in pending, try archive
    let mut issue_in_archive = if issue_in_pending.is_none() {
        archive_file.issues.iter_mut().find(|i| i.id == issue_id)
    } else {
        None
    };

    let issue = issue_in_pending.as_mut()
        .or(issue_in_archive.as_mut())
        .ok_or("Issue not found")?;

    let old_status = issue.status.clone();

    // Update fields only if provided
    if let Some(title) = updates.title {
        issue.title = title;
    }
    if let Some(description) = updates.description {
        issue.description = description;
    }
    if let Some(subtasks) = updates.subtasks {
        issue.subtasks = subtasks;
    }
    if let Some(time_estimate) = updates.time_estimate {
        issue.time_estimate = Some(time_estimate);
    }
    if let Some(complexity) = updates.complexity {
        issue.complexity = complexity;
    }
    if let Some(priority) = updates.priority {
        issue.priority = priority;
    }
    if let Some(status) = updates.status.clone() {
        // If marking as completed, set completedAt timestamp
        if status == "completed" && issue.completed_at.is_none() {
            issue.completed_at = Some(chrono::Utc::now().to_rfc3339());
        }
        // If marking as not completed, clear completedAt
        else if status != "completed" {
            issue.completed_at = None;
        }
        issue.status = status.clone();
    }
    if let Some(completed_at) = updates.completed_at {
        issue.completed_at = Some(completed_at);
    }
    if let Some(review_notes) = updates.review_notes {
        issue.review_notes = Some(review_notes);
    }
    if let Some(bug_report) = updates.bug_report {
        issue.bug_report = Some(bug_report);
    }
    if let Some(last_user_critique) = updates.last_user_critique {
        issue.last_user_critique = Some(last_user_critique);
    }

    let new_status = issue.status.clone();

    // If status changed to/from completed, move issue between files
    let status_changed = updates.status.is_some() && old_status != new_status;
    if status_changed {
        if new_status == "completed" && old_status != "completed" {
            // Move from pending to archive
            if let Some(idx) = pending_file.issues.iter().position(|i| i.id == issue_id) {
                let issue = pending_file.issues.remove(idx);
                archive_file.issues.push(issue);
            }
        } else if new_status != "completed" && old_status == "completed" {
            // Move from archive to pending
            if let Some(idx) = archive_file.issues.iter().position(|i| i.id == issue_id) {
                let issue = archive_file.issues.remove(idx);
                pending_file.issues.push(issue);
            }
        }
    }

    // Write both files
    write_issues_file(path, &pending_file)?;
    write_issues_archive_file(path, &archive_file)?;

    Ok(())
}

#[tauri::command]
pub async fn delete_issue(project_path: String, issue_id: String) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut pending_file = read_issues_file(path)?;
    let mut archive_file = read_issues_archive_file(path)?;

    // Find the issue to get its original feedback ID before deleting
    let original_feedback_id = pending_file.issues
        .iter()
        .find(|i| i.id == issue_id)
        .and_then(|i| i.original_feedback_id.clone())
        .or_else(|| {
            archive_file.issues
                .iter()
                .find(|i| i.id == issue_id)
                .and_then(|i| i.original_feedback_id.clone())
        });

    // Remove the issue from both files
    pending_file.issues.retain(|i| i.id != issue_id);
    archive_file.issues.retain(|i| i.id != issue_id);

    write_issues_file(path, &pending_file)?;
    write_issues_archive_file(path, &archive_file)?;

    // If the issue was linked to archived feedback, clean up the link
    if let Some(feedback_id) = original_feedback_id {
        let mut feedback_archive = read_archived_feedback(path)?;

        // Find the archived feedback item and remove this issue ID from its refinedIntoIssueIds array
        if let Some(feedback_item) = feedback_archive.feedback.iter_mut().find(|f| f.id == feedback_id) {
            if let Some(ref mut issue_ids) = feedback_item.refined_into_issue_ids {
                issue_ids.retain(|id| id != &issue_id);
            }
        }

        write_archived_feedback(path, &feedback_archive)?;
    }

    Ok(())
}

const FEEDBACK_FILE: &str = "feedback.json";
const FEEDBACK_COMPLETED_FILE: &str = "feedback-completed.json";

fn read_feedback_file(project_path: &Path, filename: &str) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(VIBE_DIR).join(filename);

    if !feedback_path.exists() {
        return Ok(FeedbackFile::default());
    }

    let contents = fs::read_to_string(&feedback_path)
        .map_err(|e| format!("Failed to read feedback file: {}", e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse feedback file: {}", e))
}

fn write_feedback_file(project_path: &Path, filename: &str, feedback_file: &FeedbackFile) -> Result<(), String> {
    let vibe_dir = project_path.join(VIBE_DIR);
    let feedback_path = vibe_dir.join(filename);

    let json = serde_json::to_string_pretty(feedback_file)
        .map_err(|e| format!("Failed to serialize feedback: {}", e))?;

    fs::write(&feedback_path, json)
        .map_err(|e| format!("Failed to write feedback file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn migrate_completed_feedback_to_issues(project_path: String) -> Result<usize, String> {
    let path = Path::new(&project_path);

    // Read existing issues
    let mut issues_file = read_issues_file(path)?;

    // Read completed feedback from both possible locations
    let mut pending_feedback = read_feedback_file(path, FEEDBACK_FILE)?;
    let completed_feedback_file = read_feedback_file(path, FEEDBACK_COMPLETED_FILE)?;

    // Collect all completed feedback items
    let mut completed_feedback: Vec<_> = completed_feedback_file.feedback;

    // Also check pending feedback for any completed items
    let (still_pending, also_completed): (Vec<_>, Vec<_>) = pending_feedback.feedback
        .into_iter()
        .partition(|f| f.status != "completed");

    completed_feedback.extend(also_completed);

    let migration_count = completed_feedback.len();

    if migration_count == 0 {
        return Ok(0);
    }

    // Convert each completed feedback item to an issue
    for feedback in completed_feedback {
        let issue = Issue {
            id: Uuid::new_v4().to_string(),
            original_feedback_id: Some(feedback.id.clone()),
            title: feedback.text.clone(),
            description: format!("Migrated from completed feedback: {}", feedback.text),
            subtasks: vec![],
            time_estimate: Some("Unknown".to_string()),
            complexity: 3, // Default to moderate complexity for migrated items
            priority: feedback.priority,
            status: "completed".to_string(),
            created_at: feedback.created_at.clone(),
            completed_at: feedback.completed_at,
            review_notes: None,
            bug_report: None,
            last_user_critique: None,
        };

        issues_file.issues.push(issue);
    }

    // Write updated issues file
    write_issues_file(path, &issues_file)?;

    // Clear completed feedback files
    pending_feedback.feedback = still_pending;
    write_feedback_file(path, FEEDBACK_FILE, &pending_feedback)?;

    let empty_feedback = FeedbackFile { feedback: vec![] };
    write_feedback_file(path, FEEDBACK_COMPLETED_FILE, &empty_feedback)?;

    Ok(migration_count)
}

/// Migrate completed issues from issues.json to issues-archive.json
/// This helps keep the main issues file small for better performance
#[tauri::command]
pub async fn migrate_completed_issues(project_path: String) -> Result<usize, String> {
    let path = Path::new(&project_path);

    let mut pending_file = read_issues_file(path)?;
    let mut archive_file = read_issues_archive_file(path)?;

    // Split issues into pending and completed
    let (still_pending, newly_completed): (Vec<_>, Vec<_>) = pending_file.issues
        .into_iter()
        .partition(|i| i.status != "completed");

    let migration_count = newly_completed.len();

    if migration_count == 0 {
        return Ok(0);
    }

    // Move completed issues to archive
    archive_file.issues.extend(newly_completed);

    // Update files
    pending_file.issues = still_pending;
    write_issues_file(path, &pending_file)?;
    write_issues_archive_file(path, &archive_file)?;

    Ok(migration_count)
}
