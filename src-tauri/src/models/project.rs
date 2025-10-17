use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub path: String,
    pub description: String,
    pub tech_stack: Vec<String>,
    pub deployment_url: Option<String>,
    pub status: String, // "draft", "in-progress", "deployed"
    pub last_modified: Option<String>,
    pub feedback_count: usize,
    pub has_uncommitted_changes: bool,
}

#[derive(Debug, Deserialize)]
pub struct ProjectMetadata {
    pub name: Option<String>,
    pub description: String,
    pub deployment_url: Option<String>,
    pub tech_stack: Option<Vec<String>>,
    pub status: Option<String>,
}
