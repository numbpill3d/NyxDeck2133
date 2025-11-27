// NixDeck 2133 - AI Orchestration Module
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct AILoadout {
    pub name: String,
    pub model: String,
    pub system_prompt: String,
    pub temperature: f32,
    pub max_tokens: u32,
    pub tools_enabled: Vec<String>,
}

pub async fn send_message(message: String, loadout: String) -> Result<String, String> {
    // TODO: Implement OpenRouter API integration
    // This is a placeholder that will be expanded
    Ok(format!("[AI Response Placeholder]\nReceived: {}\nLoadout: {}", message, loadout))
}

pub async fn load_loadout(name: String) -> Result<String, String> {
    let loadout_path = get_loadout_path(&name);
    
    if !loadout_path.exists() {
        return Err(format!("Loadout '{}' not found", name));
    }

    std::fs::read_to_string(loadout_path)
        .map_err(|e| format!("Failed to load loadout: {}", e))
}

pub async fn save_loadout(name: String, config: String) -> Result<(), String> {
    let loadout_path = get_loadout_path(&name);
    
    std::fs::write(loadout_path, config)
        .map_err(|e| format!("Failed to save loadout: {}", e))
}

pub async fn list_loadouts() -> Result<Vec<String>, String> {
    let loadouts_dir = get_loadouts_dir();
    
    if !loadouts_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = std::fs::read_dir(loadouts_dir)
        .map_err(|e| format!("Failed to read loadouts directory: {}", e))?;

    let mut loadouts = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".nd2133-loadout") {
                    loadouts.push(name.trim_end_matches(".nd2133-loadout").to_string());
                }
            }
        }
    }

    Ok(loadouts)
}

fn get_loadouts_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".nixdeck").join("loadouts")
}

fn get_loadout_path(name: &str) -> PathBuf {
    get_loadouts_dir().join(format!("{}.nd2133-loadout", name))
}
