use std::collections::HashMap;
use serde_json::Value;

// Embed prompts.json at compile time
const PROMPTS_JSON: &str = include_str!("../../../prompts.json");

#[tauri::command]
pub async fn get_prompt(
    prompt_name: String,
    replacements: HashMap<String, String>
) -> Result<String, String> {
    // Parse the embedded JSON
    let prompts: HashMap<String, Value> = serde_json::from_str(PROMPTS_JSON)
        .map_err(|e| format!("Failed to parse embedded prompts JSON: {}", e))?;

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

