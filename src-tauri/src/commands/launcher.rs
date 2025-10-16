use std::process::Command;

#[tauri::command]
pub async fn launch_claude_code(project_path: String, _prompt: String) -> Result<(), String> {
    // Copy prompt to clipboard using tauri plugin
    #[cfg(target_os = "windows")]
    {
        // Launch a new cmd window in the project directory with claude command
        // Using start with a new window title to handle spaces in paths properly
        Command::new("cmd")
            .args(&[
                "/c",
                "start",
                "Claude Code",  // Window title (required when path has spaces)
                "cmd",
                "/k",
                "claude"
            ])
            .current_dir(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to launch Claude Code: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Launch terminal in the project directory
        Command::new("gnome-terminal")
            .args(&["--", "bash", "-c", &format!("cd '{}' && claude; exec bash", project_path)])
            .spawn()
            .map_err(|e| format!("Failed to launch Claude Code: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_in_explorer(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/c", "start", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    Ok(())
}
