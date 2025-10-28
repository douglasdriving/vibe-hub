use serde::{Deserialize, Serialize};

fn default_time_estimate() -> String {
    "Not estimated".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Issue {
    pub id: String,
    #[serde(alias = "originalFeedbackId", rename = "originalFeedbackId")]
    pub original_feedback_id: Option<String>,
    pub title: String,
    pub description: String,
    pub subtasks: Vec<String>,
    #[serde(alias = "timeEstimate", rename = "timeEstimate", default = "default_time_estimate")]
    pub time_estimate: String,
    pub priority: u8,
    pub status: String, // 'pending' | 'in-progress' | 'for-review' | 'completed'
    #[serde(alias = "createdAt", rename = "createdAt")]
    pub created_at: String,
    #[serde(alias = "completedAt", rename = "completedAt")]
    pub completed_at: Option<String>,
    #[serde(
        alias = "reviewNotes",
        rename = "reviewNotes",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub review_notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct NewIssue {
    pub original_feedback_id: Option<String>,
    pub title: String,
    pub description: String,
    pub subtasks: Vec<String>,
    pub time_estimate: String,
    pub priority: u8,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateIssue {
    pub title: Option<String>,
    pub description: Option<String>,
    pub subtasks: Option<Vec<String>>,
    pub time_estimate: Option<String>,
    pub priority: Option<u8>,
    pub status: Option<String>,
    pub completed_at: Option<String>,
    pub review_notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IssueFile {
    pub issues: Vec<Issue>,
}

impl Default for IssueFile {
    fn default() -> Self {
        Self {
            issues: Vec::new(),
        }
    }
}
