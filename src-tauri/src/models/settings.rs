use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub projects_directory: String,
    #[serde(default = "default_sound_effects_enabled")]
    pub sound_effects_enabled: bool,
}

fn default_sound_effects_enabled() -> bool {
    true
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            projects_directory: String::new(),
            sound_effects_enabled: true,
        }
    }
}
