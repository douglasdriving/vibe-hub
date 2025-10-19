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
        // Use cmd to launch code, which will inherit the user's PATH
        Command::new("cmd")
            .args(&["/c", "code", &project_path])
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}. Make sure VS Code is installed.", e))?;
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
        // Try common Fork installation paths
        let fork_paths = vec![
            r"C:\Users\{}\AppData\Local\Fork\Fork.exe",
            r"C:\Program Files\Fork\Fork.exe",
            r"C:\Program Files (x86)\Fork\Fork.exe",
        ];

        let username = std::env::var("USERNAME").unwrap_or_default();
        let user_fork_path = format!(r"C:\Users\{}\AppData\Local\Fork\Fork.exe", username);

        // Try user-specific path first
        if let Ok(_) = Command::new(&user_fork_path)
            .arg(&project_path)
            .spawn() {
            return Ok(());
        }

        // Try other common paths
        for fork_path in &fork_paths[1..] {
            if let Ok(_) = Command::new(fork_path)
                .arg(&project_path)
                .spawn() {
                return Ok(());
            }
        }

        Err("Fork not found. Make sure Fork is installed. Fork is typically installed at: C:\\Users\\{username}\\AppData\\Local\\Fork\\Fork.exe".to_string())
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["-a", "Fork", &project_path])
            .spawn()
            .map_err(|e| format!("Failed to open Fork: {}. Make sure Fork is installed.", e))?;

        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("fork")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open Fork: {}. Make sure Fork is installed.", e))?;

        Ok(())
    }
}
