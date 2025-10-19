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
    pub has_dev: bool,
    pub has_build: bool,
    pub dev_script_name: Option<String>,
    pub dev_command: Option<String>,
    pub build_command: Option<String>,
}

/// Detect available npm scripts in package.json
#[tauri::command]
pub async fn detect_npm_scripts(project_path: String) -> Result<AvailableScripts, String> {
    let package_json_path = Path::new(&project_path).join("package.json");

    if !package_json_path.exists() {
        return Ok(AvailableScripts {
            has_dev: false,
            has_build: false,
            dev_script_name: None,
            dev_command: None,
            build_command: None,
        });
    }

    let contents = fs::read_to_string(&package_json_path)
        .map_err(|e| format!("Failed to read package.json: {}", e))?;

    let package: PackageJson = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse package.json: {}", e))?;

    if let Some(scripts) = package.scripts {
        // Check for dev server scripts - prioritize "dev" over "start"
        let (has_dev, dev_script_name, dev_command) = if scripts.contains_key("dev") {
            (true, Some("dev".to_string()), Some(scripts.get("dev").unwrap().clone()))
        } else if scripts.contains_key("start") {
            (true, Some("start".to_string()), Some(scripts.get("start").unwrap().clone()))
        } else {
            (false, None, None)
        };

        let has_build = scripts.contains_key("build");

        Ok(AvailableScripts {
            has_dev,
            has_build,
            dev_script_name,
            dev_command,
            build_command: if has_build {
                Some(scripts.get("build").unwrap().clone())
            } else {
                None
            },
        })
    } else {
        Ok(AvailableScripts {
            has_dev: false,
            has_build: false,
            dev_script_name: None,
            dev_command: None,
            build_command: None,
        })
    }
}

/// Run an npm script in a new terminal window
#[tauri::command]
pub async fn run_npm_script(project_path: String, script_name: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to open a new window and run the npm script
        let ps_command = format!(
            "Start-Process cmd -ArgumentList '/k','cd /d \"{}\" && npm run {}'",
            project_path.replace("\"", "`\""),
            script_name
        );

        Command::new("powershell")
            .args(&["-NoProfile", "-Command", &ps_command])
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
