use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub path: String,
    pub description: String,
    pub platform: Option<String>, // Windows/macOS/Linux/Web/Mobile/Cross-platform
    pub is_local_first: Option<bool>,
    pub is_open_source: Option<bool>,
    pub has_backend: Option<bool>,
    pub deployment_url: Option<String>,
    pub status: String, // "initialized", "idea", "designed", "tech-spec-ready", "metadata-ready", "mvp-implemented", "technical-testing", "design-testing", "deployment", "deployed"
    pub color: Option<String>, // Project color for UI
    pub text_color: Option<String>, // Text color for contrast with background
    pub icon_path: Option<String>, // Custom project icon path (relative to project root)
    pub last_modified: Option<String>,
    pub feedback_count: usize,
    pub highest_feedback_priority: Option<u8>, // 1-5, None if no pending feedback
    pub has_uncommitted_changes: bool,
    pub has_git_repo: bool,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMetadata {
    pub name: Option<String>,
    pub description: Option<String>,
    pub platform: Option<String>,
    #[serde(rename = "isLocalFirst")]
    pub is_local_first: Option<bool>,
    #[serde(rename = "isOpenSource")]
    pub is_open_source: Option<bool>,
    #[serde(rename = "hasBackend")]
    pub has_backend: Option<bool>,
    pub deployment_url: Option<String>,
    pub status: Option<String>,
    pub icon_path: Option<String>,
}

impl Default for ProjectMetadata {
    fn default() -> Self {
        ProjectMetadata {
            name: None,
            description: None,
            platform: None,
            is_local_first: None,
            is_open_source: None,
            has_backend: None,
            deployment_url: None,
            status: None,
            icon_path: None,
        }
    }
}
