// NixDeck 2133 - Safety & Rollback Module
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct Snapshot {
    pub name: String,
    pub created: String,
    pub description: String,
    pub files: Vec<String>,
}

pub async fn create_snapshot(name: String) -> Result<(), String> {
    let snapshot_dir = get_snapshot_path(&name);
    
    if snapshot_dir.exists() {
        return Err(format!("Snapshot '{}' already exists", name));
    }
    
    fs::create_dir_all(&snapshot_dir)
        .map_err(|e| format!("Failed to create snapshot directory: {}", e))?;
    
    // Snapshot critical configs
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let config_dir = home.join(".config");
    
    let critical_components = vec![
        "waybar",
        "polybar",
        "eww",
        "kitty",
        "alacritty",
        "picom",
    ];
    
    let mut snapshotted_files = Vec::new();
    
    for component in critical_components {
        let src = config_dir.join(component);
        if src.exists() {
            let dst = snapshot_dir.join(component);
            if let Some(parent) = dst.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create directory: {}", e))?;
            }
            copy_recursive(&src, &dst)?;
            snapshotted_files.push(component.to_string());
        }
    }
    
    // Create metadata
    let metadata = Snapshot {
        name: name.clone(),
        created: chrono::Local::now().to_rfc3339(),
        description: String::new(),
        files: snapshotted_files,
    };
    
    let metadata_path = snapshot_dir.join("metadata.json");
    let metadata_json = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    
    fs::write(metadata_path, metadata_json)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;
    
    Ok(())
}

pub async fn list_snapshots() -> Result<Vec<String>, String> {
    let snapshots_dir = get_snapshots_dir();
    
    if !snapshots_dir.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(snapshots_dir)
        .map_err(|e| format!("Failed to read snapshots directory: {}", e))?;
    
    let mut snapshots = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if entry.path().is_dir() {
                if let Some(name) = entry.file_name().to_str() {
                    snapshots.push(name.to_string());
                }
            }
        }
    }
    
    Ok(snapshots)
}

pub async fn restore_snapshot(name: String) -> Result<(), String> {
    let snapshot_dir = get_snapshot_path(&name);
    
    if !snapshot_dir.exists() {
        return Err(format!("Snapshot '{}' not found", name));
    }
    
    // Read metadata
    let metadata_path = snapshot_dir.join("metadata.json");
    let metadata_content = fs::read_to_string(metadata_path)
        .map_err(|e| format!("Failed to read snapshot metadata: {}", e))?;
    
    let metadata: Snapshot = serde_json::from_str(&metadata_content)
        .map_err(|e| format!("Failed to parse snapshot metadata: {}", e))?;
    
    // Restore files
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let config_dir = home.join(".config");
    
    for component in metadata.files {
        let src = snapshot_dir.join(&component);
        let dst = config_dir.join(&component);
        
        if src.exists() {
            // Backup current config before restoring
            if dst.exists() {
                let backup = dst.with_extension("pre-restore-backup");
                fs::rename(&dst, &backup)
                    .map_err(|e| format!("Failed to backup current config: {}", e))?;
            }
            
            copy_recursive(&src, &dst)?;
        }
    }
    
    Ok(())
}

pub async fn delete_snapshot(name: String) -> Result<(), String> {
    let snapshot_dir = get_snapshot_path(&name);
    
    if !snapshot_dir.exists() {
        return Err(format!("Snapshot '{}' not found", name));
    }
    
    fs::remove_dir_all(snapshot_dir)
        .map_err(|e| format!("Failed to delete snapshot: {}", e))
}

// Helper functions

fn copy_recursive(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    if src.is_dir() {
        fs::create_dir_all(dst)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
        
        let entries = fs::read_dir(src)
            .map_err(|e| format!("Failed to read directory: {}", e))?;
        
        for entry in entries {
            if let Ok(entry) = entry {
                let src_path = entry.path();
                let dst_path = dst.join(entry.file_name());
                copy_recursive(&src_path, &dst_path)?;
            }
        }
    } else {
        fs::copy(src, dst)
            .map_err(|e| format!("Failed to copy file: {}", e))?;
    }
    
    Ok(())
}

fn get_snapshots_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".nixdeck").join("snapshots")
}

fn get_snapshot_path(name: &str) -> PathBuf {
    get_snapshots_dir().join(name)
}
