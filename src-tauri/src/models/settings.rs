use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub projects_directory: String,
    #[serde(default = "default_sound_effects_enabled")]
    pub sound_effects_enabled: bool,
    #[serde(default = "default_launch_on_startup")]
    pub launch_on_startup: bool,
    #[serde(default = "default_auto_refine_on_startup")]
    pub auto_refine_on_startup: bool,
    #[serde(default)]
    pub github_token: Option<String>,
    #[serde(default = "default_github_integration_enabled")]
    pub github_integration_enabled: bool,
}

fn default_sound_effects_enabled() -> bool {
    true
}

fn default_launch_on_startup() -> bool {
    false
}

fn default_auto_refine_on_startup() -> bool {
    false
}

fn default_github_integration_enabled() -> bool {
    false
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            projects_directory: String::new(),
            sound_effects_enabled: true,
            launch_on_startup: false,
            auto_refine_on_startup: false,
            github_token: None,
            github_integration_enabled: false,
        }
    }
}
