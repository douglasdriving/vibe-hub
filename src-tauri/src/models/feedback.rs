use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedbackItem {
    pub id: String,
    pub text: String,
    pub priority: u8,
    pub status: String,
    #[serde(alias = "created_at", rename = "createdAt")]
    pub created_at: String,
    #[serde(alias = "completed_at", rename = "completedAt")]
    pub completed_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct NewFeedbackItem {
    pub text: String,
    pub priority: u8,
    pub status: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFeedbackItem {
    pub text: Option<String>,
    pub priority: Option<u8>,
    pub status: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedbackFile {
    pub feedback: Vec<FeedbackItem>,
}

impl Default for FeedbackFile {
    fn default() -> Self {
        Self {
            feedback: Vec::new(),
        }
    }
}
