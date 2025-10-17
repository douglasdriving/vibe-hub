use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub projects_directory: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            projects_directory: String::new(),
        }
    }
}
