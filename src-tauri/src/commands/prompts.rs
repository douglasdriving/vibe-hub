use std::fs;
use std::path::PathBuf;
use std::collections::HashMap;

const PROMPTS_FILE: &str = "prompts.md";

fn get_app_root() -> Result<PathBuf, String> {
    // Get the current executable's directory
    std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))
        .and_then(|exe_path| {
            exe_path
                .parent()
                .ok_or_else(|| "Failed to get executable parent directory".to_string())
                .map(|p| p.to_path_buf())
        })
}

fn parse_prompts_file(content: &str) -> HashMap<String, String> {
    let mut prompts = HashMap::new();
    let mut current_prompt: Option<String> = None;
    let mut current_content = String::new();
    let mut in_code_block = false;

    for line in content.lines() {
        // Check for prompt section headers
        if line.starts_with("## ") && !in_code_block {
            // Save previous prompt if exists
            if let Some(ref name) = current_prompt {
                prompts.insert(name.clone(), current_content.trim().to_string());
            }

            // Start new prompt
            let prompt_name = line.trim_start_matches("## ").trim().to_string();
            // Skip "Notes" section
            if prompt_name == "Notes" {
                current_prompt = None;
            } else {
                current_prompt = Some(prompt_name);
                current_content = String::new();
            }
            continue;
        }

        // Track code block state
        if line.starts_with("```") {
            in_code_block = !in_code_block;
            // Don't include the ``` markers themselves
            continue;
        }

        // Collect content for current prompt (only inside code blocks)
        if in_code_block && current_prompt.is_some() {
            current_content.push_str(line);
            current_content.push('\n');
        }
    }

    // Save last prompt
    if let Some(ref name) = current_prompt {
        prompts.insert(name.clone(), current_content.trim().to_string());
    }

    prompts
}

#[tauri::command]
pub async fn get_prompt(prompt_name: String, replacements: HashMap<String, String>) -> Result<String, String> {
    // Try to find prompts.md in the app directory or current working directory
    let mut prompts_path = PathBuf::from(PROMPTS_FILE);

    // If file doesn't exist in CWD, try app root
    if !prompts_path.exists() {
        if let Ok(app_root) = get_app_root() {
            prompts_path = app_root.join(PROMPTS_FILE);
        }
    }

    // If still doesn't exist, try parent directories (for development mode)
    if !prompts_path.exists() {
        if let Ok(cwd) = std::env::current_dir() {
            prompts_path = cwd.join(PROMPTS_FILE);

            // Try parent directory
            if !prompts_path.exists() {
                if let Some(parent) = cwd.parent() {
                    prompts_path = parent.join(PROMPTS_FILE);
                }
            }

            // Try two levels up (for Tauri dev mode)
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
        return Err(format!("Prompts file not found at: {:?}", prompts_path));
    }

    let content = fs::read_to_string(&prompts_path)
        .map_err(|e| format!("Failed to read prompts file: {}", e))?;

    let prompts = parse_prompts_file(&content);

    let mut prompt = prompts
        .get(&prompt_name)
        .ok_or_else(|| format!("Prompt '{}' not found in prompts file", prompt_name))?
        .clone();

    // Apply replacements
    for (key, value) in replacements {
        let placeholder = format!("{{{}}}", key);
        prompt = prompt.replace(&placeholder, &value);
    }

    Ok(prompt)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_prompts_file() {
        let content = r#"
# Vibe Hub - Claude Prompts

## Feedback Workflow Prompt

**Used when**: Copying feedback items

```
I need help with {PROJECT_NAME}

{FEEDBACK_ITEMS}
```

## Idea Refinement Prompt

**Used when**: Moving from initialized

```
I have an idea for {PROJECT_NAME}
```

## Notes

This is a note
"#;

        let prompts = parse_prompts_file(content);

        assert_eq!(prompts.len(), 2);
        assert!(prompts.contains_key("Feedback Workflow Prompt"));
        assert!(prompts.contains_key("Idea Refinement Prompt"));
        assert!(!prompts.contains_key("Notes"));

        let feedback_prompt = prompts.get("Feedback Workflow Prompt").unwrap();
        assert!(feedback_prompt.contains("{PROJECT_NAME}"));
        assert!(feedback_prompt.contains("{FEEDBACK_ITEMS}"));
    }
}
