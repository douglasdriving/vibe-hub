use crate::models::{Project, FeedbackFile};
use std::fs;
use std::path::Path;
use uuid::Uuid;

const VIBE_DIR: &str = ".vibe";
const FEEDBACK_FILE: &str = "feedback.json";
const METADATA_FILE: &str = "metadata.md";

// Legacy file names for migration
const LEGACY_FEEDBACK_FILE: &str = "vibe-hub-feedback.json";
const LEGACY_METADATA_FILE: &str = "vibe-hub.md";

fn is_git_repo(path: &Path) -> bool {
    path.join(".git").exists()
}

fn migrate_to_vibe_folder(project_path: &Path) -> Result<(), String> {
    let vibe_dir = project_path.join(VIBE_DIR);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    // Migrate feedback file if it exists in old location
    let old_feedback = project_path.join(LEGACY_FEEDBACK_FILE);
    let new_feedback = vibe_dir.join(FEEDBACK_FILE);
    if old_feedback.exists() && !new_feedback.exists() {
        fs::rename(&old_feedback, &new_feedback)
            .map_err(|e| format!("Failed to migrate feedback file: {}", e))?;
    }

    // Migrate metadata file if it exists in old location
    let old_metadata = project_path.join(LEGACY_METADATA_FILE);
    let new_metadata = vibe_dir.join(METADATA_FILE);
    if old_metadata.exists() && !new_metadata.exists() {
        fs::rename(&old_metadata, &new_metadata)
            .map_err(|e| format!("Failed to migrate metadata file: {}", e))?;
    }

    Ok(())
}

fn get_project_name(path: &Path) -> String {
    path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string()
}

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

fn parse_metadata_file(project_path: &Path) -> (Option<String>, String, Option<String>, Vec<String>, Option<String>) {
    let metadata_path = project_path.join(VIBE_DIR).join(METADATA_FILE);

    if !metadata_path.exists() {
        return (None, String::new(), None, Vec::new(), None);
    }

    let contents = fs::read_to_string(&metadata_path).unwrap_or_default();

    // Simple parsing - look for patterns in markdown
    let mut name: Option<String> = None;
    let mut description = String::new();
    let mut deployment_url: Option<String> = None;
    let mut tech_stack = Vec::new();
    let mut status: Option<String> = None;

    let lines: Vec<&str> = contents.lines().collect();
    let mut in_description = false;
    let mut in_tech_stack = false;

    for line in lines {
        let trimmed = line.trim();

        // Parse Name: field
        if trimmed.starts_with("Name:") {
            name = Some(trimmed.trim_start_matches("Name:").trim().to_string());
            continue;
        }

        // Parse Status: field
        if trimmed.starts_with("Status:") {
            status = Some(trimmed.trim_start_matches("Status:").trim().to_string());
            continue;
        }

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

    (name, description, deployment_url, tech_stack, status)
}

fn auto_detect_status(_project_path: &Path, has_git: bool, deployment_url: &Option<String>) -> String {
    if deployment_url.is_some() {
        "deployed".to_string()
    } else if has_git {
        "in-progress".to_string()
    } else {
        "draft".to_string()
    }
}

fn ensure_metadata_file(project_path: &Path) -> Result<(), String> {
    let vibe_dir = project_path.join(VIBE_DIR);
    let metadata_path = vibe_dir.join(METADATA_FILE);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    if metadata_path.exists() {
        return Ok(());
    }

    let folder_name = get_project_name(project_path);

    let template = format!(r#"Name: {}
Status: draft

## Description

[Add a brief description of what this project does and its purpose]

## Tech Stack

- [Technology 1]
- [Technology 2]
- [Technology 3]

## Deployment

[Add deployment URL if applicable, or remove this section]
"#, folder_name);

    fs::write(&metadata_path, template)
        .map_err(|e| format!("Failed to create metadata file: {}", e))?;

    Ok(())
}

fn get_last_modified(project_path: &Path) -> Option<String> {
    use std::process::Command;

    // Try to get last commit date from git
    let output = Command::new("git")
        .arg("-C")
        .arg(project_path)
        .arg("log")
        .arg("-1")
        .arg("--format=%aI")
        .output();

    if let Ok(output) = output {
        if output.status.success() {
            let date_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !date_str.is_empty() {
                return Some(date_str);
            }
        }
    }

    // Fallback to filesystem metadata
    if let Ok(metadata) = fs::metadata(project_path) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
                let secs = duration.as_secs() as i64;
                let nsecs = duration.subsec_nanos();
                if let Some(dt) = chrono::DateTime::from_timestamp(secs, nsecs) {
                    return Some(dt.to_rfc3339());
                }
            }
        }
    }

    None
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

        // Process ALL directories
        if path.is_dir() {
            // Migrate old files to .vibe folder if needed
            let _ = migrate_to_vibe_folder(&path);

            // Auto-create metadata file if it doesn't exist
            let _ = ensure_metadata_file(&path);

            let folder_name = get_project_name(&path);
            let has_git = is_git_repo(&path);
            let (display_name, description, deployment_url, tech_stack, metadata_status) = parse_metadata_file(&path);

            // Use metadata status if provided, otherwise auto-detect
            let status = metadata_status.unwrap_or_else(|| auto_detect_status(&path, has_git, &deployment_url));

            let feedback_file = read_feedback_file(&path).unwrap_or_default();
            let feedback_count = feedback_file.feedback.iter().filter(|f| f.status == "pending").count();

            let project = Project {
                id: Uuid::new_v4().to_string(),
                name: folder_name,
                display_name,
                path: path.to_string_lossy().to_string(),
                description,
                platform: None, // TODO: Parse from JSON metadata
                is_local_first: None,
                is_open_source: None,
                has_backend: None,
                deployment_url,
                status,
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

    let folder_name = get_project_name(path);
    let has_git = is_git_repo(path);
    let (display_name, description, deployment_url, tech_stack, metadata_status) = parse_metadata_file(path);

    let status = metadata_status.unwrap_or_else(|| auto_detect_status(path, has_git, &deployment_url));

    let feedback_file = read_feedback_file(path).unwrap_or_default();
    let feedback_count = feedback_file.feedback.iter().filter(|f| f.status == "pending").count();

    Ok(Project {
        id: Uuid::new_v4().to_string(),
        name: folder_name,
        display_name,
        path: project_path.clone(),
        description,
        platform: None, // TODO: Parse from JSON metadata
        is_local_first: None,
        is_open_source: None,
        has_backend: None,
        deployment_url,
        status,
        last_modified: get_last_modified(path),
        feedback_count,
        has_uncommitted_changes: false,
    })
}

#[tauri::command]
pub async fn update_project_metadata(
    project_path: String,
    description: String,
    tech_stack: Vec<String>,
    deployment_url: Option<String>,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let vibe_dir = path.join(VIBE_DIR);
    let metadata_path = vibe_dir.join(METADATA_FILE);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    // Create the markdown content
    let mut content = String::from("# Project Metadata\n\n");

    // Add description
    content.push_str("## Description\n\n");
    if !description.is_empty() {
        content.push_str(&description);
        content.push_str("\n\n");
    }

    // Add tech stack
    content.push_str("## Tech Stack\n\n");
    for tech in &tech_stack {
        content.push_str(&format!("- {}\n", tech));
    }
    content.push('\n');

    // Add deployment URL
    if let Some(url) = deployment_url {
        content.push_str("## Deployment\n\n");
        content.push_str(&url);
        content.push('\n');
    }

    fs::write(&metadata_path, content)
        .map_err(|e| format!("Failed to write metadata file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn create_metadata_template(project_path: String) -> Result<(), String> {
    let path = Path::new(&project_path);
    let vibe_dir = path.join(VIBE_DIR);
    let metadata_path = vibe_dir.join(METADATA_FILE);

    // Create .vibe directory if it doesn't exist
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    // Only create if it doesn't exist
    if metadata_path.exists() {
        return Ok(());
    }

    let template = r#"# Project Metadata

## Description

[Add a brief description of what this project does and its purpose]

## Tech Stack

- [Technology 1]
- [Technology 2]
- [Technology 3]

## Deployment

[Add deployment URL if applicable, or remove this section]
"#;

    fs::write(&metadata_path, template)
        .map_err(|e| format!("Failed to create metadata template: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn check_metadata_exists(project_path: String) -> Result<bool, String> {
    let path = Path::new(&project_path);
    let metadata_path = path.join(VIBE_DIR).join(METADATA_FILE);

    if !metadata_path.exists() {
        return Ok(false);
    }

    // Check if it has meaningful content (not just the template)
    let contents = fs::read_to_string(&metadata_path).unwrap_or_default();

    // Consider it empty if it contains template placeholders
    let has_content = !contents.contains("[Add a brief description")
        && !contents.contains("[Technology 1]")
        && contents.len() > 50; // Has some actual content

    Ok(has_content)
}

#[tauri::command]
pub async fn generate_metadata_prompt(_project_path: String, project_name: String) -> Result<String, String> {
    let prompt = format!(
        r#"Please analyze this project and fill out the vibe-hub.md metadata file with accurate information.

Project: {}

Instructions:
1. Scan key files in the project (package.json, README.md, source files, etc.)
2. Come up with a nice display name for the project (not just the folder name)
3. Determine the project status (draft/in-progress/deployed)
4. Identify the project's purpose and write a clear description
5. List all major technologies in the tech stack
6. Look for deployment configuration or URLs if present

The vibe-hub.md file should have this format:

Name: [A nice human-readable project name]
Status: [draft OR in-progress OR deployed]

## Description

[Write a 1-2 sentence description of what this project does]

## Tech Stack

- [Technology 1]
- [Technology 2]
- [Technology 3]

## Deployment

[Add deployment URL if found, otherwise remove this section]

Please update the vibe-hub.md file now with accurate information based on your analysis of the codebase."#,
        project_name
    );

    Ok(prompt)
}
