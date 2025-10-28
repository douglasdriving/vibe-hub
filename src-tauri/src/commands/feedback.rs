use crate::models::{FeedbackItem, FeedbackFile, NewFeedbackItem, UpdateFeedbackItem};
use std::fs;
use std::path::Path;
use uuid::Uuid;
use chrono;

const VIBE_DIR: &str = ".vibe";
const FEEDBACK_FILE: &str = "feedback.json";
const FEEDBACK_COMPLETED_FILE: &str = "feedback-completed.json";
const FEEDBACK_ARCHIVE_FILE: &str = "feedback-archive.json";

fn read_feedback_file_from_path(feedback_path: &Path) -> Result<FeedbackFile, String> {
    if !feedback_path.exists() {
        return Ok(FeedbackFile::default());
    }

    let contents = fs::read_to_string(feedback_path)
        .map_err(|e| format!("Failed to read feedback file: {}", e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse feedback file: {}", e))
}

fn read_pending_feedback(project_path: &Path) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_FILE);
    read_feedback_file_from_path(&feedback_path)
}

fn read_completed_feedback(project_path: &Path) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_COMPLETED_FILE);
    read_feedback_file_from_path(&feedback_path)
}

fn write_feedback_file_to_path(feedback_path: &Path, feedback_file: &FeedbackFile) -> Result<(), String> {
    let vibe_dir = feedback_path.parent()
        .ok_or("Invalid feedback path")?;

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(feedback_file)
        .map_err(|e| format!("Failed to serialize feedback: {}", e))?;

    fs::write(feedback_path, json)
        .map_err(|e| format!("Failed to write feedback file: {}", e))?;

    Ok(())
}

fn write_pending_feedback(project_path: &Path, feedback_file: &FeedbackFile) -> Result<(), String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_FILE);
    write_feedback_file_to_path(&feedback_path, feedback_file)
}

fn write_completed_feedback(project_path: &Path, feedback_file: &FeedbackFile) -> Result<(), String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_COMPLETED_FILE);
    write_feedback_file_to_path(&feedback_path, feedback_file)
}

/// Migrate old feedback.json files that contain both pending and completed items.
/// This splits them into separate files for backwards compatibility.
fn migrate_feedback_if_needed(project_path: &Path) -> Result<(), String> {
    let pending_path = project_path.join(VIBE_DIR).join(FEEDBACK_FILE);
    let completed_path = project_path.join(VIBE_DIR).join(FEEDBACK_COMPLETED_FILE);

    // Only migrate if:
    // 1. The pending file exists
    // 2. The completed file doesn't exist yet
    // 3. The pending file contains completed items
    if !pending_path.exists() || completed_path.exists() {
        return Ok(());
    }

    let mut pending_file = read_pending_feedback(project_path)?;

    // Check if there are any completed items
    let has_completed = pending_file.feedback.iter().any(|f| f.status == "completed");

    if !has_completed {
        return Ok(());
    }

    // Split the feedback into pending and completed
    let mut completed_items = Vec::new();
    let mut pending_items = Vec::new();

    for item in pending_file.feedback {
        if item.status == "completed" {
            completed_items.push(item);
        } else {
            pending_items.push(item);
        }
    }

    // Write the split files
    pending_file.feedback = pending_items;
    let completed_file = FeedbackFile {
        feedback: completed_items,
    };

    write_pending_feedback(project_path, &pending_file)?;
    write_completed_feedback(project_path, &completed_file)?;

    Ok(())
}

#[tauri::command]
pub async fn get_feedback(project_path: String) -> Result<Vec<FeedbackItem>, String> {
    let path = Path::new(&project_path);

    // Migrate old feedback files if needed (backwards compatibility)
    migrate_feedback_if_needed(path)?;

    let pending_file = read_pending_feedback(path)?;
    let completed_file = read_completed_feedback(path)?;

    // Merge pending and completed feedback
    let mut all_feedback = pending_file.feedback;
    all_feedback.extend(completed_file.feedback);

    // Sort by priority (1 = highest priority)
    all_feedback.sort_by(|a, b| a.priority.cmp(&b.priority));

    Ok(all_feedback)
}

#[tauri::command]
pub async fn add_feedback(
    project_path: String,
    feedback: NewFeedbackItem,
) -> Result<FeedbackItem, String> {
    let path = Path::new(&project_path);
    let mut feedback_file = read_pending_feedback(path)?;

    let new_feedback = FeedbackItem {
        id: Uuid::new_v4().to_string(),
        text: feedback.text,
        priority: feedback.priority,
        status: "pending".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        completed_at: None,
        refined_into_issue_ids: None,
        review_notes: None,
    };

    feedback_file.feedback.push(new_feedback.clone());
    write_pending_feedback(path, &feedback_file)?;

    Ok(new_feedback)
}

#[tauri::command]
pub async fn update_feedback(
    project_path: String,
    feedback_id: String,
    updates: UpdateFeedbackItem,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut pending_file = read_pending_feedback(path)?;
    let mut completed_file = read_completed_feedback(path)?;

    // Find the item in either pending or completed
    let pending_item = pending_file.feedback.iter_mut().find(|f| f.id == feedback_id);
    let completed_item = completed_file.feedback.iter_mut().find(|f| f.id == feedback_id);

    let (item, was_pending) = if let Some(item) = pending_item {
        (item, true)
    } else if let Some(item) = completed_item {
        (item, false)
    } else {
        return Err("Feedback item not found".to_string());
    };

    let old_status = item.status.clone();

    // Update fields only if provided
    if let Some(text) = updates.text {
        item.text = text;
    }
    if let Some(priority) = updates.priority {
        item.priority = priority;
    }
    if let Some(status) = &updates.status {
        item.status = status.clone();
    }
    if let Some(completed_at) = updates.completed_at {
        item.completed_at = Some(completed_at);
    }
    if let Some(refined_into_issue_ids) = updates.refined_into_issue_ids {
        item.refined_into_issue_ids = Some(refined_into_issue_ids);
    }
    if let Some(review_notes) = updates.review_notes {
        item.review_notes = Some(review_notes);
    }

    let new_status = item.status.clone();
    let status_changed = old_status != new_status;

    // Check if we need to move the item between files
    if status_changed {
        let mut item_clone = item.clone();

        if was_pending && new_status == "completed" {
            // Move from pending to completed
            // Ensure completedAt is set if not already provided
            if item_clone.completed_at.is_none() {
                item_clone.completed_at = Some(chrono::Utc::now().to_rfc3339());
            }
            pending_file.feedback.retain(|f| f.id != feedback_id);
            completed_file.feedback.push(item_clone);
        } else if !was_pending && new_status == "pending" {
            // Move from completed to pending
            // Clear completedAt when moving back to pending
            item_clone.completed_at = None;
            completed_file.feedback.retain(|f| f.id != feedback_id);
            pending_file.feedback.push(item_clone);
        }
    }

    // Write both files (in case we moved an item between them)
    write_pending_feedback(path, &pending_file)?;
    write_completed_feedback(path, &completed_file)?;

    Ok(())
}

#[tauri::command]
pub async fn delete_feedback(project_path: String, feedback_id: String) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut pending_file = read_pending_feedback(path)?;
    let mut completed_file = read_completed_feedback(path)?;

    // Remove from both files (only one will actually have it)
    pending_file.feedback.retain(|f| f.id != feedback_id);
    completed_file.feedback.retain(|f| f.id != feedback_id);

    write_pending_feedback(path, &pending_file)?;
    write_completed_feedback(path, &completed_file)?;

    Ok(())
}

fn read_archived_feedback(project_path: &Path) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_ARCHIVE_FILE);
    read_feedback_file_from_path(&feedback_path)
}

fn write_archived_feedback(project_path: &Path, feedback_file: &FeedbackFile) -> Result<(), String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_ARCHIVE_FILE);
    write_feedback_file_to_path(&feedback_path, feedback_file)
}

#[tauri::command]
pub async fn get_archived_feedback(project_path: String) -> Result<Vec<FeedbackItem>, String> {
    let path = Path::new(&project_path);
    let archive_file = read_archived_feedback(path)?;

    // Sort by created_at (most recent first)
    let mut archived = archive_file.feedback;
    archived.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(archived)
}

#[tauri::command]
pub async fn move_feedback_to_archive(
    project_path: String,
    feedback_id: String,
    refined_into_issue_ids: Vec<String>,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut pending_file = read_pending_feedback(path)?;
    let mut archive_file = read_archived_feedback(path)?;

    // Find the feedback item in pending
    let feedback_index = pending_file.feedback.iter()
        .position(|f| f.id == feedback_id)
        .ok_or("Feedback item not found in pending feedback")?;

    // Remove from pending and update with issue IDs
    let mut feedback_item = pending_file.feedback.remove(feedback_index);
    feedback_item.refined_into_issue_ids = Some(refined_into_issue_ids);
    feedback_item.status = "refined".to_string();

    // Add to archive
    archive_file.feedback.push(feedback_item);

    // Write both files
    write_pending_feedback(path, &pending_file)?;
    write_archived_feedback(path, &archive_file)?;

    Ok(())
}
