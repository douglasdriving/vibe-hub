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

#[tauri::command]
pub async fn open_in_vscode(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // On Windows, try common VS Code installation paths
        let localappdata_path = format!(r"{}\Programs\Microsoft VS Code\bin\code.cmd",
            std::env::var("LOCALAPPDATA").unwrap_or_default());

        let code_paths = vec![
            r"C:\Program Files\Microsoft VS Code\bin\code.cmd".to_string(),
            r"C:\Program Files (x86)\Microsoft VS Code\bin\code.cmd".to_string(),
            localappdata_path,
        ];

        // Try each path
        for code_path in &code_paths {
            if let Ok(_) = Command::new(code_path)
                .arg(&project_path)
                .spawn() {
                return Ok(());
            }
        }

        // If all paths failed, try 'code' command as fallback
        Command::new("code")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}. Tried common installation paths but VS Code was not found.", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("code")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}. Make sure VS Code is installed and 'code' is in your PATH.", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_in_terminal(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/c", "start", "cmd"])
            .current_dir(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!("tell application \"Terminal\" to do script \"cd '{}'\"", project_path);
        Command::new("osascript")
            .args(&["-e", &script])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("gnome-terminal")
            .args(&["--working-directory", &project_path])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_in_fork(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/c", "fork", &project_path])
            .spawn()
            .map_err(|e| format!("Failed to open Fork: {}. Make sure Fork is installed.", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["-a", "Fork", &project_path])
            .spawn()
            .map_err(|e| format!("Failed to open Fork: {}. Make sure Fork is installed.", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("fork")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open Fork: {}. Make sure Fork is installed.", e))?;
    }

    Ok(())
}
