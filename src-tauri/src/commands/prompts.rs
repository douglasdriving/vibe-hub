use std::fs;
use std::path::PathBuf;
use std::collections::HashMap;
use serde_json::Value;

const PROMPTS_FILE: &str = "prompts.json";

#[tauri::command]
pub async fn get_prompt(prompt_name: String, replacements: HashMap<String, String>) -> Result<String, String> {
    // Try to find prompts.json, checking multiple locations
    let mut prompts_path = PathBuf::from(PROMPTS_FILE);

    // If file doesn't exist in CWD, try parent directories (for development mode)
    if !prompts_path.exists() {
        if let Ok(cwd) = std::env::current_dir() {
            prompts_path = cwd.join(PROMPTS_FILE);

            // Try parent directory
            if !prompts_path.exists() {
                if let Some(parent) = cwd.parent() {
                    prompts_path = parent.join(PROMPTS_FILE);
                }
            }

            // Try two levels up (for Tauri dev mode when running from src-tauri)
            if !prompts_path.exists() {
                if let Some(parent) = cwd.parent() {
                    if let Some(grandparent) = parent.parent() {
                        prompts_path = grandparent.join(PROMPTS_FILE);
                    }
                }
            }
        }
    }

    if !prompts_path.exists() {
        return Err(format!("Prompts file not found. Please ensure prompts.json exists in the project root."));
    }

    // Read and parse JSON file
    let content = fs::read_to_string(&prompts_path)
        .map_err(|e| format!("Failed to read prompts file: {}", e))?;

    let prompts: HashMap<String, Value> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse prompts JSON: {}", e))?;

    // Get the prompt by key
    let mut prompt = prompts
        .get(&prompt_name)
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("Prompt '{}' not found in prompts.json", prompt_name))?
        .to_string();

    // Apply replacements
    for (key, value) in replacements {
        let placeholder = format!("{{{}}}", key);
        prompt = prompt.replace(&placeholder, &value);
    }

    Ok(prompt)
}

