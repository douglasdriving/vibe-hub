use crate::models::{Project, FeedbackFile};
use std::fs;
use std::path::Path;
use uuid::Uuid;

const FEEDBACK_FILE: &str = "vibe-hub-feedback.json";
const METADATA_FILE: &str = "vibe-hub.md";

fn is_git_repo(path: &Path) -> bool {
    path.join(".git").exists()
}

fn get_project_name(path: &Path) -> String {
    path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string()
}

fn read_feedback_file(project_path: &Path) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(FEEDBACK_FILE);

    if !feedback_path.exists() {
        return Ok(FeedbackFile::default());
    }

    let contents = fs::read_to_string(&feedback_path)
        .map_err(|e| format!("Failed to read feedback file: {}", e))?;

    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse feedback file: {}", e))
}

fn parse_metadata_file(project_path: &Path) -> (String, Option<String>, Vec<String>) {
    let metadata_path = project_path.join(METADATA_FILE);

    if !metadata_path.exists() {
        return (String::new(), None, Vec::new());
    }

    let contents = fs::read_to_string(&metadata_path).unwrap_or_default();

    // Simple parsing - look for patterns in markdown
    let mut description = String::new();
    let mut deployment_url: Option<String> = None;
    let mut tech_stack = Vec::new();

    let lines: Vec<&str> = contents.lines().collect();
    let mut in_description = false;
    let mut in_tech_stack = false;

    for line in lines {
        let trimmed = line.trim();

        if trimmed.starts_with("## Description") {
            in_description = true;
            in_tech_stack = false;
            continue;
        } else if trimmed.starts_with("## Tech Stack") {
            in_tech_stack = true;
            in_description = false;
            continue;
        } else if trimmed.starts_with("## Deployment") {
            in_tech_stack = false;
            in_description = false;
            continue;
        } else if trimmed.starts_with("##") {
            in_description = false;
            in_tech_stack = false;
            continue;
        }

        if in_description && !trimmed.is_empty() {
            if !description.is_empty() {
                description.push(' ');
            }
            description.push_str(trimmed);
        } else if in_tech_stack && trimmed.starts_with('-') {
            let tech = trimmed.trim_start_matches('-').trim();
            if !tech.is_empty() {
                tech_stack.push(tech.to_string());
            }
        } else if !in_description && !in_tech_stack {
            // Check for deployment URL
            if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
                deployment_url = Some(trimmed.to_string());
            }
        }
    }

    (description, deployment_url, tech_stack)
}

fn get_last_modified(project_path: &Path) -> String {
    // Try to get last modified from filesystem
    if let Ok(metadata) = fs::metadata(project_path) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(datetime) = modified.duration_since(std::time::UNIX_EPOCH) {
                return chrono::DateTime::from_timestamp(datetime.as_secs() as i64, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
            }
        }
    }
    chrono::Utc::now().to_rfc3339()
}

#[tauri::command]
pub async fn scan_projects(projects_dir: String) -> Result<Vec<Project>, String> {
    let projects_path = Path::new(&projects_dir);

    if !projects_path.exists() {
        return Err("Projects directory does not exist".to_string());
    }

    let entries = fs::read_dir(projects_path)
        .map_err(|e| format!("Failed to read projects directory: {}", e))?;

    let mut projects = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        // Only process directories with git repos
        if path.is_dir() && is_git_repo(&path) {
            let name = get_project_name(&path);
            let (description, deployment_url, tech_stack) = parse_metadata_file(&path);
            let feedback_file = read_feedback_file(&path).unwrap_or_default();
            let feedback_count = feedback_file.feedback.iter().filter(|f| f.status == "pending").count();

            let project = Project {
                id: Uuid::new_v4().to_string(),
                name,
                path: path.to_string_lossy().to_string(),
                description,
                tech_stack,
                deployment_url,
                last_modified: get_last_modified(&path),
                feedback_count,
                has_uncommitted_changes: false, // Simplified for now
            };

            projects.push(project);
        }
    }

    // Sort by last modified (newest first)
    projects.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    Ok(projects)
}

#[tauri::command]
pub async fn get_project_detail(project_path: String) -> Result<Project, String> {
    let path = Path::new(&project_path);

    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }

    let name = get_project_name(path);
    let (description, deployment_url, tech_stack) = parse_metadata_file(path);
    let feedback_file = read_feedback_file(path).unwrap_or_default();
    let feedback_count = feedback_file.feedback.iter().filter(|f| f.status == "pending").count();

    Ok(Project {
        id: Uuid::new_v4().to_string(),
        name,
        path: project_path.clone(),
        description,
        tech_stack,
        deployment_url,
        last_modified: get_last_modified(path),
        feedback_count,
        has_uncommitted_changes: false,
    })
}
