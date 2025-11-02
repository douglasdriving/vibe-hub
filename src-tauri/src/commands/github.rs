// GitHub integration commands for fetching and syncing issues with GitHub repositories
// Provides bidirectional sync: import GitHub issues as feedback, close issues when completed

use octocrab::{Octocrab, OctocrabBuilder};
use std::path::Path;
use uuid::Uuid;
use chrono::Utc;
use crate::models::feedback::{FeedbackFile, FeedbackItem};
use crate::models::settings::Settings;
use std::fs;
use serde_json;
use tauri::{AppHandle, Manager};

/// Parse a GitHub URL to extract owner and repo name
/// Supports formats like:
/// - https://github.com/owner/repo
/// - https://github.com/owner/repo.git
/// - git@github.com:owner/repo.git
fn parse_github_url(url: &str) -> Result<(String, String), String> {
    let url = url.trim();

    // Handle HTTPS URLs
    if url.starts_with("https://github.com/") {
        let path = url.trim_start_matches("https://github.com/")
            .trim_end_matches(".git")
            .trim_end_matches('/');

        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() >= 2 {
            return Ok((parts[0].to_string(), parts[1].to_string()));
        }
    }

    // Handle SSH URLs
    if url.starts_with("git@github.com:") {
        let path = url.trim_start_matches("git@github.com:")
            .trim_end_matches(".git");

        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() >= 2 {
            return Ok((parts[0].to_string(), parts[1].to_string()));
        }
    }

    Err(format!("Invalid GitHub URL format: {}", url))
}

/// Create an authenticated Octocrab instance using the provided GitHub token
fn create_github_client(token: &str) -> Result<Octocrab, String> {
    OctocrabBuilder::new()
        .personal_token(token.to_string())
        .build()
        .map_err(|e| format!("Failed to create GitHub client: {}", e))
}

/// Get GitHub URL from git remote origin
fn get_github_url_from_git(project_path: &Path) -> Option<String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    use std::os::windows::process::CommandExt;

    let mut cmd = Command::new("git");
    cmd.args(&["remote", "get-url", "origin"])
        .current_dir(project_path);

    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let output = cmd.output().ok()?;

    if !output.status.success() {
        return None;
    }

    let url = String::from_utf8(output.stdout)
        .ok()?
        .trim()
        .to_string();

    if url.is_empty() || !url.contains("github.com") {
        return None;
    }

    // Convert SSH URLs to HTTPS
    let https_url = if url.starts_with("git@github.com:") {
        url.replace("git@github.com:", "https://github.com/")
            .trim_end_matches(".git")
            .to_string()
    } else {
        url.trim_end_matches(".git").to_string()
    };

    Some(https_url)
}

/// Read the feedback file from a project directory
fn read_feedback_file(project_path: &Path) -> Result<FeedbackFile, String> {
    let feedback_path = project_path.join(".vibe").join("feedback.json");

    if !feedback_path.exists() {
        // Create .vibe directory if it doesn't exist
        let vibe_dir = project_path.join(".vibe");
        if !vibe_dir.exists() {
            fs::create_dir(&vibe_dir)
                .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
        }
        return Ok(FeedbackFile::default());
    }

    let content = fs::read_to_string(&feedback_path)
        .map_err(|e| format!("Failed to read feedback file: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse feedback file: {}", e))
}

/// Write the feedback file to a project directory
fn write_feedback_file(project_path: &Path, feedback_file: &FeedbackFile) -> Result<(), String> {
    // Ensure .vibe directory exists
    let vibe_dir = project_path.join(".vibe");
    if !vibe_dir.exists() {
        fs::create_dir(&vibe_dir)
            .map_err(|e| format!("Failed to create .vibe directory: {}", e))?;
    }

    let feedback_path = vibe_dir.join("feedback.json");

    let content = serde_json::to_string_pretty(&feedback_file)
        .map_err(|e| format!("Failed to serialize feedback: {}", e))?;

    fs::write(&feedback_path, content)
        .map_err(|e| format!("Failed to write feedback file: {}", e))
}

/// Read settings to get GitHub token
fn read_settings(app: &AppHandle) -> Result<Settings, String> {
    let config_dir = app.path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;

    let settings_path = config_dir.join("settings.json");

    if !settings_path.exists() {
        return Ok(Settings::default());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))
}

/// Fetch open issues from a GitHub repository and import them as feedback items
///
/// This command:
/// 1. Reads the project's GitHub URL from vibe-hub.md
/// 2. Authenticates with GitHub using the token from settings
/// 3. Fetches all open issues from the repository
/// 4. Creates or updates feedback items for each issue (marked with github_issue_number and github_issue_url)
/// 5. Returns count of issues fetched
#[tauri::command]
pub async fn fetch_github_issues(
    app: AppHandle,
    project_path: String,
    github_url: String,
) -> Result<usize, String> {
    println!("[fetch_github_issues] Starting fetch for: {}", github_url);

    // Read settings to get GitHub token
    let settings = read_settings(&app)?;
    let token = settings.github_token
        .ok_or_else(|| "GitHub token not configured. Please add your token in Settings.".to_string())?;

    // Check if GitHub integration is enabled globally
    if !settings.github_integration_enabled {
        return Err("GitHub integration is disabled in settings. Please enable it in Settings.".to_string());
    }

    // Parse GitHub URL to extract owner and repo
    let (owner, repo) = parse_github_url(&github_url)?;
    println!("[fetch_github_issues] Parsed owner='{}', repo='{}'", owner, repo);

    // Create GitHub client
    let client = create_github_client(&token)?;
    println!("[fetch_github_issues] GitHub client created successfully");

    // Fetch open issues from GitHub
    println!("[fetch_github_issues] Fetching open issues from GitHub API...");
    let issues = client
        .issues(&owner, &repo)
        .list()
        .state(octocrab::params::State::Open)
        .per_page(100)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch GitHub issues: {}. Please check your GitHub token and repository access.", e))?;

    println!("[fetch_github_issues] Found {} open issues on GitHub", issues.items.len());

    // Read existing feedback and issues
    let path = Path::new(&project_path);
    let mut feedback_file = read_feedback_file(path)?;

    // Also read issues and archived data to avoid re-importing already tracked issues
    use crate::commands::issues::{read_issues_file, read_issues_archive_file, read_archived_feedback};
    let issues_file = read_issues_file(path).unwrap_or_default();
    let issues_archive = read_issues_archive_file(path).unwrap_or_default();
    let feedback_archive = read_archived_feedback(path).unwrap_or_default();

    // Track how many new issues we import
    let mut imported_count = 0;

    // Process each GitHub issue
    for issue in issues.items {
        let issue_number = issue.number;
        let issue_url = issue.html_url.to_string();

        // Check if this issue already exists in:
        // 1. Active feedback
        let in_feedback = feedback_file.feedback.iter().any(|f| {
            f.github_issue_number == Some(issue_number)
        });

        // 2. Archived feedback
        let in_feedback_archive = feedback_archive.feedback.iter().any(|f| {
            f.github_issue_number == Some(issue_number)
        });

        // 3. Active issues
        let in_issues = issues_file.issues.iter().any(|i| {
            i.github_issue_number == Some(issue_number)
        });

        // 4. Archived issues
        let in_issues_archive = issues_archive.issues.iter().any(|i| {
            i.github_issue_number == Some(issue_number)
        });

        let already_tracked = in_feedback || in_feedback_archive || in_issues || in_issues_archive;

        if already_tracked {
            println!("[fetch_github_issues] Skipping issue #{} - already tracked in local data", issue_number);
            continue;
        }

        if !already_tracked {
            // Format the feedback text with title and body
            let text = if let Some(body) = &issue.body {
                let body_trimmed = body.trim();
                if body_trimmed.is_empty() {
                    issue.title.clone()
                } else {
                    format!("{}\n\n{}", issue.title, body_trimmed)
                }
            } else {
                issue.title.clone()
            };

            println!("[fetch_github_issues] Importing issue #{}: {}", issue_number, issue.title);

            // Create new feedback item from GitHub issue
            let feedback_item = FeedbackItem {
                id: Uuid::new_v4().to_string(),
                text,
                priority: 3, // Default to medium priority
                status: "pending".to_string(),
                created_at: Utc::now().to_rfc3339(),
                completed_at: None,
                refined_into_issue_ids: None,
                review_notes: None,
                related_issue_id: None,
                github_issue_number: Some(issue_number),
                github_issue_url: Some(issue_url),
            };

            feedback_file.feedback.push(feedback_item);
            imported_count += 1;
        }
    }

    // Save updated feedback file if we imported any issues
    if imported_count > 0 {
        println!("[fetch_github_issues] Importing {} new issue(s) to feedback file", imported_count);
        write_feedback_file(path, &feedback_file)?;
        println!("[fetch_github_issues] Feedback file updated successfully");
    } else {
        println!("[fetch_github_issues] No new issues to import (all already exist in feedback)");
    }

    Ok(imported_count)
}

/// Sync GitHub issues for all projects with GitHub integration enabled
///
/// This command:
/// 1. Reads settings to check if global GitHub integration is enabled
/// 2. Scans all projects in the projects directory
/// 3. For each project with GitHub integration enabled, fetches and imports issues
/// 4. Returns count of total issues synced across all projects
#[tauri::command]
pub async fn sync_all_github_issues(
    app: AppHandle,
    projects_dir: String,
) -> Result<usize, String> {
    use std::fs;

    println!("[sync_all_github_issues] Starting sync for projects in: {}", projects_dir);

    // Read settings to check if GitHub integration is globally enabled
    let settings = read_settings(&app)?;

    println!("[sync_all_github_issues] GitHub integration enabled: {}", settings.github_integration_enabled);
    println!("[sync_all_github_issues] GitHub token present: {}", settings.github_token.is_some());

    if !settings.github_integration_enabled {
        println!("[sync_all_github_issues] GitHub integration is disabled globally, skipping sync");
        return Ok(0); // Silently skip if globally disabled
    }

    let _token = match &settings.github_token {
        Some(t) => t,
        None => {
            println!("[sync_all_github_issues] No GitHub token configured, skipping sync");
            return Ok(0); // Silently skip if no token configured
        }
    };

    let projects_path = Path::new(&projects_dir);
    if !projects_path.exists() {
        return Err("Projects directory does not exist".to_string());
    }

    let entries = fs::read_dir(projects_path)
        .map_err(|e| format!("Failed to read projects directory: {}", e))?;

    let mut total_synced = 0;
    let mut projects_scanned = 0;
    let mut projects_with_metadata = 0;
    let mut projects_with_github_url = 0;
    let mut projects_with_sync_enabled = 0;

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                eprintln!("[sync_all_github_issues] Failed to read entry: {}", e);
                continue;
            }
        };

        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        projects_scanned += 1;
        let project_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();

        // Check if project has GitHub integration enabled
        // Get GitHub URL from git remote
        let github_url = match get_github_url_from_git(&path) {
            Some(url) => url,
            None => {
                println!("[sync_all_github_issues] Project '{}': No GitHub remote found", project_name);
                continue;
            }
        };

        projects_with_github_url += 1;
        println!("[sync_all_github_issues] Project '{}': GitHub URL = '{}'", project_name, github_url);

        // Check if GitHub sync is enabled for this project
        let metadata_path = path.join(".vibe").join("metadata.md");
        let github_enabled = if metadata_path.exists() {
            projects_with_metadata += 1;
            match fs::read_to_string(&metadata_path) {
                Ok(content) => {
                    let enabled = content.lines().any(|line| {
                        let trimmed = line.trim();
                        if trimmed.starts_with("GitHubSync:") || trimmed.starts_with("githubSync:") {
                            let value = trimmed.split(':').nth(1).unwrap_or("").trim().to_lowercase();
                            value == "true" || value == "enabled" || value == "yes"
                        } else {
                            false
                        }
                    });
                    println!("[sync_all_github_issues] Project '{}': GitHubSync = {}", project_name, enabled);
                    enabled
                }
                Err(_) => false
            }
        } else {
            println!("[sync_all_github_issues] Project '{}': No .vibe/metadata.md found, defaulting to sync disabled", project_name);
            false
        };

        if !github_enabled {
            println!("[sync_all_github_issues] Project '{}': Skipping (GitHubSync not enabled)", project_name);
            continue;
        }

        projects_with_sync_enabled += 1;

        println!("[sync_all_github_issues] Project '{}': Attempting to sync from {}", project_name, github_url);

        // Try to sync this project
        match fetch_github_issues(app.clone(), path.to_string_lossy().to_string(), github_url.clone()).await {
            Ok(count) => {
                println!("[sync_all_github_issues] Project '{}': Successfully synced {} issue(s)", project_name, count);
                total_synced += count;
            },
            Err(e) => {
                // Log error but continue with other projects
                eprintln!("[sync_all_github_issues] Project '{}': ERROR - {}", project_name, e);
            }
        }
    }

    println!("\n[sync_all_github_issues] ===== SYNC SUMMARY =====");
    println!("[sync_all_github_issues] Projects scanned: {}", projects_scanned);
    println!("[sync_all_github_issues] Projects with vibe-hub.md: {}", projects_with_metadata);
    println!("[sync_all_github_issues] Projects with GitHub URL: {}", projects_with_github_url);
    println!("[sync_all_github_issues] Projects with sync enabled: {}", projects_with_sync_enabled);
    println!("[sync_all_github_issues] Total issues synced: {}", total_synced);
    println!("[sync_all_github_issues] ========================\n");

    Ok(total_synced)
}

/// Close a GitHub issue when the corresponding feedback item is marked as completed
///
/// This command:
/// 1. Authenticates with GitHub using the token from settings
/// 2. Closes the specified issue with a comment indicating it was completed in Vibe Hub
/// 3. Returns success or error
#[tauri::command]
pub async fn close_github_issue(
    app: AppHandle,
    github_url: String,
    issue_number: u64,
) -> Result<(), String> {
    // Read settings to get GitHub token
    let settings = read_settings(&app)?;
    let token = settings.github_token
        .ok_or_else(|| "GitHub token not configured. Please add your token in Settings.".to_string())?;

    // Parse GitHub URL to extract owner and repo
    let (owner, repo) = parse_github_url(&github_url)?;

    // Create GitHub client
    let client = create_github_client(&token)?;

    // Close the issue
    use octocrab::models::IssueState;
    client
        .issues(&owner, &repo)
        .update(issue_number)
        .state(IssueState::Closed)
        .send()
        .await
        .map_err(|e| format!("Failed to close GitHub issue: {}", e))?;

    // Add a comment indicating it was completed in Vibe Hub
    let comment = "This issue was completed and closed via Vibe Hub.";
    client
        .issues(&owner, &repo)
        .create_comment(issue_number, comment)
        .await
        .map_err(|e| format!("Failed to add comment to GitHub issue: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_github_url_https() {
        let (owner, repo) = parse_github_url("https://github.com/owner/repo").unwrap();
        assert_eq!(owner, "owner");
        assert_eq!(repo, "repo");
    }

    #[test]
    fn test_parse_github_url_https_with_git() {
        let (owner, repo) = parse_github_url("https://github.com/owner/repo.git").unwrap();
        assert_eq!(owner, "owner");
        assert_eq!(repo, "repo");
    }

    #[test]
    fn test_parse_github_url_ssh() {
        let (owner, repo) = parse_github_url("git@github.com:owner/repo.git").unwrap();
        assert_eq!(owner, "owner");
        assert_eq!(repo, "repo");
    }

    #[test]
    fn test_parse_github_url_invalid() {
        let result = parse_github_url("not-a-github-url");
        assert!(result.is_err());
    }
}
