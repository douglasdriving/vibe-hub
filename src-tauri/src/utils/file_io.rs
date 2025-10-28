use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Read a JSON file and deserialize it into type T
/// If the file doesn't exist, returns the default value for T
pub fn read_json_file<T>(path: &Path) -> Result<T, String>
where
    T: for<'de> Deserialize<'de> + Default,
{
    if !path.exists() {
        return Ok(T::default());
    }

    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse JSON: {}", e))
}

/// Write data to a JSON file with pretty formatting
pub fn write_json_file<T>(path: &Path, data: &T) -> Result<(), String>
where
    T: Serialize,
{
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(data)
        .map_err(|e| format!("Failed to serialize JSON: {}", e))?;

    fs::write(path, json)
        .map_err(|e| format!("Failed to write file: {}", e))
}
