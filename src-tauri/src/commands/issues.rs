use crate::models::{Issue, IssueFile, NewIssue, UpdateIssue};
use std::fs;
use std::path::Path;
use uuid::Uuid;
use chrono;

const VIBE_DIR: &str = ".vibe";
const ISSUES_FILE: &str = "issues.json";

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

#[tauri::command]
pub async fn get_issues(project_path: String) -> Result<Vec<Issue>, String> {
    let path = Path::new(&project_path);
    let issues_file = read_issues_file(path)?;

    // Sort by priority (1 = highest priority)
    let mut issues = issues_file.issues;
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
        priority: issue.priority,
        status: issue.status,
        created_at: chrono::Utc::now().to_rfc3339(),
        completed_at: None,
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
    let mut issues_file = read_issues_file(path)?;

    let issue = issues_file.issues.iter_mut()
        .find(|i| i.id == issue_id)
        .ok_or("Issue not found")?;

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
        issue.time_estimate = time_estimate;
    }
    if let Some(priority) = updates.priority {
        issue.priority = priority;
    }
    if let Some(status) = updates.status {
        // If marking as completed, set completedAt timestamp
        if status == "completed" && issue.completed_at.is_none() {
            issue.completed_at = Some(chrono::Utc::now().to_rfc3339());
        }
        // If marking as not completed, clear completedAt
        else if status != "completed" {
            issue.completed_at = None;
        }
        issue.status = status;
    }
    if let Some(completed_at) = updates.completed_at {
        issue.completed_at = Some(completed_at);
    }

    write_issues_file(path, &issues_file)?;

    Ok(())
}

#[tauri::command]
pub async fn delete_issue(project_path: String, issue_id: String) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut issues_file = read_issues_file(path)?;

    issues_file.issues.retain(|i| i.id != issue_id);

    write_issues_file(path, &issues_file)?;

    Ok(())
}
