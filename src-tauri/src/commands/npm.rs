use std::fs;
use std::path::Path;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PackageJson {
    pub scripts: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailableScripts {
    pub has_test: bool,
    pub has_build: bool,
    pub test_command: Option<String>,
    pub build_command: Option<String>,
}

/// Detect available npm scripts in package.json
#[tauri::command]
pub async fn detect_npm_scripts(project_path: String) -> Result<AvailableScripts, String> {
    let package_json_path = Path::new(&project_path).join("package.json");

    if !package_json_path.exists() {
        return Ok(AvailableScripts {
            has_test: false,
            has_build: false,
            test_command: None,
            build_command: None,
        });
    }

    let contents = fs::read_to_string(&package_json_path)
        .map_err(|e| format!("Failed to read package.json: {}", e))?;

    let package: PackageJson = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse package.json: {}", e))?;

    if let Some(scripts) = package.scripts {
        let has_test = scripts.contains_key("test");
        let has_build = scripts.contains_key("build");

        Ok(AvailableScripts {
            has_test,
            has_build,
            test_command: if has_test {
                Some(scripts.get("test").unwrap().clone())
            } else {
                None
            },
            build_command: if has_build {
                Some(scripts.get("build").unwrap().clone())
            } else {
                None
            },
        })
    } else {
        Ok(AvailableScripts {
            has_test: false,
            has_build: false,
            test_command: None,
            build_command: None,
        })
    }
}

/// Run an npm script in a new terminal window
#[tauri::command]
pub async fn run_npm_script(project_path: String, script_name: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Note: The empty quotes "" after 'start' set the window title to nothing
        // This prevents the path from being interpreted as the title
        let command = format!("cd /d \"{}\" && npm run {}", project_path, script_name);
        Command::new("cmd")
            .args(&["/c", "start", "", "cmd", "/k", &command])
            .spawn()
            .map_err(|e| format!("Failed to launch terminal: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!(
            "tell application \"Terminal\" to do script \"cd '{}' && npm run {}\"",
            project_path, script_name
        );
        Command::new("osascript")
            .args(&["-e", &script])
            .spawn()
            .map_err(|e| format!("Failed to launch terminal: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("gnome-terminal")
            .args(&[
                "--",
                "bash",
                "-c",
                &format!("cd '{}' && npm run {}; exec bash", project_path, script_name),
            ])
            .spawn()
            .map_err(|e| format!("Failed to launch terminal: {}", e))?;
    }

    Ok(())
}
