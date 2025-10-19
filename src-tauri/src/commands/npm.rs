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
    pub dev_script_type: Option<String>, // "npm", "bat", or "sh"
    pub dev_command: Option<String>,
    pub build_command: Option<String>,
}

/// Detect available npm scripts in package.json and script files
#[tauri::command]
pub async fn detect_npm_scripts(project_path: String) -> Result<AvailableScripts, String> {
    let path = Path::new(&project_path);

    // First, check for .bat or .sh script files (prioritize these for complex setups)
    let dev_bat_files = ["dev.bat", "start.bat", "dev-server.bat", "start-dev.bat"];
    let dev_sh_files = ["dev.sh", "start.sh", "dev-server.sh", "start-dev.sh"];

    // Check for Windows batch files
    for bat_file in &dev_bat_files {
        let bat_path = path.join(bat_file);
        if bat_path.exists() {
            return Ok(AvailableScripts {
                has_dev: true,
                has_build: false,
                dev_script_name: Some(bat_file.to_string()),
                dev_script_type: Some("bat".to_string()),
                dev_command: None,
                build_command: None,
            });
        }
    }

    // Check for shell scripts
    for sh_file in &dev_sh_files {
        let sh_path = path.join(sh_file);
        if sh_path.exists() {
            return Ok(AvailableScripts {
                has_dev: true,
                has_build: false,
                dev_script_name: Some(sh_file.to_string()),
                dev_script_type: Some("sh".to_string()),
                dev_command: None,
                build_command: None,
            });
        }
    }

    // If no script files found, check package.json
    let package_json_path = path.join("package.json");

    if !package_json_path.exists() {
        return Ok(AvailableScripts {
            has_dev: false,
            has_build: false,
            dev_script_name: None,
            dev_script_type: None,
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
            dev_script_type: if has_dev { Some("npm".to_string()) } else { None },
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
            dev_script_type: None,
            dev_command: None,
            build_command: None,
        })
    }
}

/// Run an npm script or script file in a new terminal window
#[tauri::command]
pub async fn run_npm_script(project_path: String, script_name: String, script_type: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let script_type = script_type.unwrap_or_else(|| "npm".to_string());

        if script_type == "bat" {
            // For .bat files, just run them directly with cmd
            let bat_path = Path::new(&project_path).join(&script_name);
            Command::new("cmd")
                .args(&["/c", "start", "cmd", "/k", bat_path.to_str().unwrap()])
                .current_dir(&project_path)
                .spawn()
                .map_err(|e| format!("Failed to launch bat file: {}", e))?;
        } else if script_type == "sh" {
            // For .sh files, run with bash
            let sh_path = Path::new(&project_path).join(&script_name);
            Command::new("cmd")
                .args(&["/c", "start", "cmd", "/k", "bash", sh_path.to_str().unwrap()])
                .current_dir(&project_path)
                .spawn()
                .map_err(|e| format!("Failed to launch sh file: {}", e))?;
        } else {
            // For npm scripts, use the npm run command
            let command = format!("npm run {}", script_name);
            Command::new("cmd")
                .args(&["/c", "start", "cmd", "/k", &command])
                .current_dir(&project_path)
                .spawn()
                .map_err(|e| format!("Failed to launch npm script: {}", e))?;
        }
    }

    #[cfg(target_os = "macos")]
    {
        let script_type = script_type.unwrap_or_else(|| "npm".to_string());

        let command = if script_type == "bat" || script_type == "sh" {
            format!("cd '{}' && ./{}", project_path, script_name)
        } else {
            format!("cd '{}' && npm run {}", project_path, script_name)
        };

        let script = format!(
            "tell application \"Terminal\" to do script \"{}\"",
            command
        );
        Command::new("osascript")
            .args(&["-e", &script])
            .spawn()
            .map_err(|e| format!("Failed to launch terminal: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let script_type = script_type.unwrap_or_else(|| "npm".to_string());

        let command = if script_type == "bat" || script_type == "sh" {
            format!("cd '{}' && ./{}; exec bash", project_path, script_name)
        } else {
            format!("cd '{}' && npm run {}; exec bash", project_path, script_name)
        };

        Command::new("gnome-terminal")
            .args(&["--", "bash", "-c", &command])
            .spawn()
            .map_err(|e| format!("Failed to launch terminal: {}", e))?;
    }

    Ok(())
}
