use crate::models::{FeedbackItem, FeedbackFile, NewFeedbackItem, UpdateFeedbackItem};
use std::fs;
use std::path::Path;
use uuid::Uuid;

const VIBE_DIR: &str = ".vibe";
const FEEDBACK_FILE: &str = "feedback.json";

fn read_feedback_file(project_path: &Path) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(VIBE_DIR).join(FEEDBACK_FILE);

    if !feedback_path.exists() {
        return Ok(FeedbackFile::default());
    }

    let contents = fs::read_to_string(&feedback_path)
        .map_err(|e| format!("Failed to read feedback file: {}", e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse feedback file: {}", e))
}

fn write_feedback_file(project_path: &Path, feedback_file: &FeedbackFile) -> Result<(), String> {
    let vibe_dir = project_path.join(VIBE_DIR);
    let feedback_path = vibe_dir.join(FEEDBACK_FILE);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(feedback_file)
        .map_err(|e| format!("Failed to serialize feedback: {}", e))?;

    fs::write(&feedback_path, json)
        .map_err(|e| format!("Failed to write feedback file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_feedback(project_path: String) -> Result<Vec<FeedbackItem>, String> {
    let path = Path::new(&project_path);
    let mut feedback_file = read_feedback_file(path)?;

    // Sort by priority (1 = highest priority)
    feedback_file.feedback.sort_by(|a, b| a.priority.cmp(&b.priority));

    Ok(feedback_file.feedback)
}

#[tauri::command]
pub async fn add_feedback(
    project_path: String,
    feedback: NewFeedbackItem,
) -> Result<FeedbackItem, String> {
    let path = Path::new(&project_path);
    let mut feedback_file = read_feedback_file(path)?;

    let new_feedback = FeedbackItem {
        id: Uuid::new_v4().to_string(),
        text: feedback.text,
        priority: feedback.priority,
        status: "pending".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        completed_at: None,
    };

    feedback_file.feedback.push(new_feedback.clone());
    write_feedback_file(path, &feedback_file)?;

    Ok(new_feedback)
}

#[tauri::command]
pub async fn update_feedback(
    project_path: String,
    feedback_id: String,
    updates: UpdateFeedbackItem,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut feedback_file = read_feedback_file(path)?;

    let item = feedback_file
        .feedback
        .iter_mut()
        .find(|f| f.id == feedback_id)
        .ok_or("Feedback item not found")?;

    // Update fields only if provided
    if let Some(text) = updates.text {
        item.text = text;
    }
    if let Some(priority) = updates.priority {
        item.priority = priority;
    }
    if let Some(status) = updates.status {
        item.status = status;
    }
    if let Some(completed_at) = updates.completed_at {
        item.completed_at = Some(completed_at);
    }

    write_feedback_file(path, &feedback_file)?;

    Ok(())
}

#[tauri::command]
pub async fn delete_feedback(project_path: String, feedback_id: String) -> Result<(), String> {
    let path = Path::new(&project_path);
    let mut feedback_file = read_feedback_file(path)?;

    feedback_file.feedback.retain(|f| f.id != feedback_id);

    write_feedback_file(path, &feedback_file)?;

    Ok(())
}
