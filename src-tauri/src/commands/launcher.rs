use std::process::Command;
use std::fs::OpenOptions;
use std::io::Write;
use std::collections::HashMap;
use std::sync::Mutex;
use serde::Serialize;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// Global session tracking
lazy_static::lazy_static! {
    static ref SESSIONS: Mutex<HashMap<String, SessionInfo>> = Mutex::new(HashMap::new());
}

#[derive(Debug, Clone, Serialize)]
pub struct SessionInfo {
    pub project_path: String,
    pub status: String, // "running", "idle", "not_started"
    pub pid: Option<u32>,
}

impl SessionInfo {
    fn new(project_path: String, pid: Option<u32>) -> Self {
        Self {
            project_path,
            status: "running".to_string(),
            pid,
        }
    }
}

pub fn log_to_file(message: &str) {
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    let log_message = format!("[{}] {}", timestamp, message);

    // Always write to stderr for debugging
    eprintln!("{}", log_message);

    // Try multiple log locations
    let mut log_locations = vec![
        std::env::temp_dir().join("vibe-hub-debug.log"),
        std::path::PathBuf::from("E:\\vibe-hub-debug.log"),
    ];

    // Add current directory if available
    if let Ok(current_dir) = std::env::current_dir() {
        log_locations.push(current_dir.join("vibe-hub-debug.log"));
    }

    for log_path in &log_locations {
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_path)
        {
            let _ = writeln!(file, "{}", log_message);
            let _ = file.flush();
            break; // Successfully wrote, stop trying other locations
        }
    }
}

#[tauri::command]
pub async fn log_debug(message: String) -> Result<(), String> {
    log_to_file(&format!("[FRONTEND] {}", message));
    Ok(())
}

#[tauri::command]
pub async fn launch_claude_code(project_path: String, prompt: String) -> Result<(), String> {
    log_to_file(&format!("launch_claude_code called with path: {}", project_path));
    log_to_file(&format!("Prompt length: {} chars", prompt.len()));

    // Register session
    {
        let mut sessions = SESSIONS.lock().unwrap();
        sessions.insert(
            project_path.clone(),
            SessionInfo::new(project_path.clone(), None),
        );
    }

    #[cfg(target_os = "windows")]
    {
        // Extract project name from path for unique window title
        let project_name = std::path::Path::new(&project_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Project");

        let window_title = format!("Claude Code - {}", project_name);

        // Create a temporary batch file to launch Claude Code
        // This approach works reliably from both GUI and console subsystems
        let temp_dir = std::env::temp_dir();
        let batch_file = temp_dir.join("vibe-hub-launch-claude.bat");

        // Generate batch file that launches claude with or without a prompt
        let batch_content = if !prompt.is_empty() {
            // Write the prompt to a temporary text file
            let prompt_file = temp_dir.join("vibe-hub-claude-prompt.txt");
            if let Err(e) = std::fs::write(&prompt_file, &prompt) {
                let error_msg = format!("Failed to create prompt file: {}", e);
                log_to_file(&error_msg);
                return Err(error_msg);
            }
            log_to_file(&format!("Prompt file created at: {:?}", prompt_file));

            // Read the prompt from the file and pass it as a command-line argument
            // Using @file syntax to read from file
            format!(
                "@echo off\ntitle {}\ncd /d \"{}\"\nclaude \"@{}\"\npause",
                window_title,
                project_path,
                prompt_file.display()
            )
        } else {
            format!(
                "@echo off\ntitle {}\ncd /d \"{}\"\nclaude\npause",
                window_title,
                project_path
            )
        };

        log_to_file(&format!("Creating batch file at: {:?}", batch_file));

        // Write the batch file
        if let Err(e) = std::fs::write(&batch_file, batch_content) {
            let error_msg = format!("Failed to create batch file: {}", e);
            log_to_file(&error_msg);
            return Err(error_msg);
        }

        log_to_file("Batch file created successfully");

        // Launch the batch file in a new console window with unique title
        log_to_file(&format!("Executing: cmd /c start \"{}\" cmd /c \"{}\"", window_title, batch_file.display()));

        let result = Command::new("cmd")
            .args(&["/c", "start", &window_title, "cmd", "/c", batch_file.to_str().unwrap()])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW - hide the intermediate cmd window
            .spawn();

        match result {
            Ok(_) => {
                log_to_file("Command spawned successfully");
                log_to_file(&format!("Batch file should be at: {}", batch_file.display()));
                Ok(())
            }
            Err(e) => {
                let error_msg = format!("Failed to launch Claude Code: {}", e);
                log_to_file(&error_msg);
                Err(error_msg)
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Launch terminal in the project directory with optional prompt
        let command = if !prompt.is_empty() {
            // Escape single quotes in the prompt for bash
            let escaped_prompt = prompt.replace("'", "'\\''");
            format!("cd '{}' && claude '{}'; exec bash", project_path, escaped_prompt)
        } else {
            format!("cd '{}' && claude; exec bash", project_path)
        };

        Command::new("gnome-terminal")
            .args(&["--", "bash", "-c", &command])
            .spawn()
            .map_err(|e| format!("Failed to launch Claude Code: {}", e))?;

        Ok(())
    }
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
            .creation_flags(0x08000000) // CREATE_NO_WINDOW - hide the cmd window
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
            .creation_flags(0x08000000) // CREATE_NO_WINDOW - hide the cmd window
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
        // Note: We intentionally DO show the terminal window (user requested it)
        // But we hide the intermediate cmd window that launches it
        Command::new("cmd")
            .args(&["/c", "start", "cmd"])
            .current_dir(&project_path)
            .creation_flags(0x08000000) // CREATE_NO_WINDOW - hide the intermediate cmd window
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
pub async fn get_debug_log_path() -> Result<String, String> {
    let log_path = std::env::temp_dir().join("vibe-hub-debug.log");
    Ok(log_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn open_in_fork(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let username = std::env::var("USERNAME").unwrap_or_default();

        // Try common Fork installation paths (with "current" subdirectory)
        let fork_paths = vec![
            format!(r"C:\Users\{}\AppData\Local\Fork\current\Fork.exe", username),
            format!(r"C:\Users\{}\AppData\Local\Fork\Fork.exe", username),
            r"C:\Program Files\Fork\Fork.exe".to_string(),
            r"C:\Program Files (x86)\Fork\Fork.exe".to_string(),
        ];

        // Try each path
        for fork_path in &fork_paths {
            if let Ok(_) = Command::new(fork_path)
                .arg(&project_path)
                .spawn() {
                return Ok(());
            }
        }

        Err("Fork not found. Make sure Fork is installed. Fork is typically installed at: C:\\Users\\{username}\\AppData\\Local\\Fork\\current\\Fork.exe".to_string())
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

#[tauri::command]
pub async fn get_session_status(project_path: String) -> Result<SessionInfo, String> {
    // First check if we have a session registered
    let has_session = {
        let sessions = SESSIONS.lock().unwrap();
        sessions.contains_key(&project_path)
    };

    if has_session {
        // Verify the window still exists
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::UI::WindowsAndMessaging::FindWindowW;
            use windows::core::PCWSTR;

            // Extract project name for unique window title
            let project_name = std::path::Path::new(&project_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Project");

            let window_title = format!("Claude Code - {}", project_name);

            let mut window_found = false;

            unsafe {
                let title_wide: Vec<u16> = window_title
                    .encode_utf16()
                    .chain(std::iter::once(0))
                    .collect();

                if let Ok(hwnd) = FindWindowW(PCWSTR::null(), PCWSTR::from_raw(title_wide.as_ptr())) {
                    if !hwnd.is_invalid() {
                        window_found = true;
                    }
                }
            }

            if !window_found {
                // Window is gone, clean up the session
                let mut sessions = SESSIONS.lock().unwrap();
                sessions.remove(&project_path);
                log_to_file(&format!("Session cleanup: window not found for {}", project_path));

                return Ok(SessionInfo {
                    project_path: project_path.clone(),
                    status: "not_started".to_string(),
                    pid: None,
                });
            }
        }

        // Window still exists or we're not on Windows, return the session
        let sessions = SESSIONS.lock().unwrap();
        if let Some(session) = sessions.get(&project_path) {
            Ok(session.clone())
        } else {
            Ok(SessionInfo {
                project_path: project_path.clone(),
                status: "not_started".to_string(),
                pid: None,
            })
        }
    } else {
        // Return not_started status if no session exists
        Ok(SessionInfo {
            project_path: project_path.clone(),
            status: "not_started".to_string(),
            pid: None,
        })
    }
}

#[tauri::command]
pub async fn focus_claude_terminal(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{FindWindowW, SetForegroundWindow};
        use windows::core::PCWSTR;

        // Extract project name for unique window title
        let project_name = std::path::Path::new(&project_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Project");

        let window_title = format!("Claude Code - {}", project_name);

        unsafe {
            let title_wide: Vec<u16> = window_title
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect();

            if let Ok(hwnd) = FindWindowW(PCWSTR::null(), PCWSTR::from_raw(title_wide.as_ptr())) {
                if !hwnd.is_invalid() {
                    let _ = SetForegroundWindow(hwnd);
                    log_to_file(&format!("Found and focused window with title: {}", window_title));
                    return Ok(());
                }
            }

            // If we couldn't find the window, clean up the session
            {
                let mut sessions = SESSIONS.lock().unwrap();
                sessions.remove(&project_path);
                log_to_file(&format!("Window not found, removed session for: {}", project_path));
            }

            Err(format!("Claude terminal window '{}' not found. It may have been closed.", window_title))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Focus terminal is only supported on Windows".to_string())
    }
}
