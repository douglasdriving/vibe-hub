use std::path::Path;
use std::fs;
use std::time::SystemTime;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileModificationInfo {
    pub feedback_modified: bool,
    pub issues_modified: bool,
}

/// Check if project files have been modified since the given timestamps
#[tauri::command]
pub async fn check_project_files_modified(
    project_path: String,
    last_feedback_check: Option<u64>,
    last_issues_check: Option<u64>,
) -> Result<FileModificationInfo, String> {
    let path = Path::new(&project_path);

    // Check feedback.json
    let feedback_path = path.join(".vibe").join("feedback.json");
    let feedback_modified = if feedback_path.exists() {
        if let Some(last_check) = last_feedback_check {
            match fs::metadata(&feedback_path) {
                Ok(metadata) => {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(duration) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                            duration.as_secs() > last_check
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                }
                Err(_) => false
            }
        } else {
            // First check, consider it modified
            true
        }
    } else {
        false
    };

    // Check issues.json
    let issues_path = path.join(".vibe").join("issues.json");
    let issues_modified = if issues_path.exists() {
        if let Some(last_check) = last_issues_check {
            match fs::metadata(&issues_path) {
                Ok(metadata) => {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(duration) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                            duration.as_secs() > last_check
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                }
                Err(_) => false
            }
        } else {
            // First check, consider it modified
            true
        }
    } else {
        false
    };

    Ok(FileModificationInfo {
        feedback_modified,
        issues_modified,
    })
}

/// Get current modification timestamps for project files
#[tauri::command]
pub async fn get_project_files_timestamps(
    project_path: String,
) -> Result<(Option<u64>, Option<u64>), String> {
    let path = Path::new(&project_path);

    // Get feedback.json timestamp
    let feedback_path = path.join(".vibe").join("feedback.json");
    let feedback_timestamp = if feedback_path.exists() {
        match fs::metadata(&feedback_path) {
            Ok(metadata) => {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(duration) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                        Some(duration.as_secs())
                    } else {
                        None
                    }
                } else {
                    None
                }
            }
            Err(_) => None
        }
    } else {
        None
    };

    // Get issues.json timestamp
    let issues_path = path.join(".vibe").join("issues.json");
    let issues_timestamp = if issues_path.exists() {
        match fs::metadata(&issues_path) {
            Ok(metadata) => {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(duration) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                        Some(duration.as_secs())
                    } else {
                        None
                    }
                } else {
                    None
                }
            }
            Err(_) => None
        }
    } else {
        None
    };

    Ok((feedback_timestamp, issues_timestamp))
}
