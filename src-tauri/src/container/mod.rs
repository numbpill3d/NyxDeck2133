// NixDeck 2133 - Desktop Container Module
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct Container {
    pub name: String,
    pub created: String,
    pub description: String,
    pub components: Vec<String>,
}

pub async fn create(name: String) -> Result<(), String> {
    let container_dir = get_container_path(&name);
    
    if container_dir.exists() {
        return Err(format!("Container '{}' already exists", name));
    }
    
    fs::create_dir_all(&container_dir)
        .map_err(|e| format!("Failed to create container directory: {}", e))?;
    
    // Snapshot current configuration
    snapshot_configs(&container_dir).await?;
    
    // Create metadata
    let metadata = Container {
        name: name.clone(),
        created: chrono::Local::now().to_rfc3339(),
        description: String::new(),
        components: get_snapshot_components(),
    };
    
    let metadata_path = container_dir.join("metadata.json");
    let metadata_json = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    
    fs::write(metadata_path, metadata_json)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;
    
    Ok(())
}

pub async fn load(name: String) -> Result<(), String> {
    let container_dir = get_container_path(&name);
    
    if !container_dir.exists() {
        return Err(format!("Container '{}' not found", name));
    }
    
    // Restore all configs from container
    restore_configs(&container_dir).await?;
    
    Ok(())
}

pub async fn list() -> Result<Vec<String>, String> {
    let containers_dir = get_containers_dir();
    
    if !containers_dir.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(containers_dir)
        .map_err(|e| format!("Failed to read containers directory: {}", e))?;
    
    let mut containers = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if entry.path().is_dir() {
                if let Some(name) = entry.file_name().to_str() {
                    containers.push(name.to_string());
                }
            }
        }
    }
    
    Ok(containers)
}

pub async fn delete(name: String) -> Result<(), String> {
    let container_dir = get_container_path(&name);
    
    if !container_dir.exists() {
        return Err(format!("Container '{}' not found", name));
    }
    
    fs::remove_dir_all(container_dir)
        .map_err(|e| format!("Failed to delete container: {}", e))
}

pub async fn export(name: String, path: String) -> Result<(), String> {
    let container_dir = get_container_path(&name);
    
    if !container_dir.exists() {
        return Err(format!("Container '{}' not found", name));
    }
    
    // Create tar archive
    let output = std::process::Command::new("tar")
        .args(&["-czf", &path, "-C", &container_dir.parent().unwrap().to_string_lossy(), &name])
        .output()
        .map_err(|e| format!("Failed to create archive: {}", e))?;
    
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    
    Ok(())
}

// Helper functions

async fn snapshot_configs(container_dir: &PathBuf) -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let config_dir = home.join(".config");
    
    let components = vec![
        "waybar",
        "polybar",
        "eww",
        "conky",
        "kitty",
        "alacritty",
        "picom",
        "dunst",
        "rofi",
        "gtk-3.0",
        "gtk-4.0",
    ];
    
    for component in components {
        let src = config_dir.join(component);
        if src.exists() {
            let dst = container_dir.join("config").join(component);
            if let Some(parent) = dst.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create directory: {}", e))?;
            }
            copy_recursive(&src, &dst)?;
        }
    }
    
    Ok(())
}

async fn restore_configs(container_dir: &PathBuf) -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let config_dir = home.join(".config");
    let source_config = container_dir.join("config");
    
    if !source_config.exists() {
        return Err("Container has no config directory".to_string());
    }
    
    let entries = fs::read_dir(&source_config)
        .map_err(|e| format!("Failed to read container config: {}", e))?;
    
    for entry in entries {
        if let Ok(entry) = entry {
            let src = entry.path();
            let component_name = entry.file_name();
            let dst = config_dir.join(&component_name);
            
            // Backup existing config
            if dst.exists() {
                let backup = dst.with_extension("nixdeck-backup");
                fs::rename(&dst, &backup)
                    .map_err(|e| format!("Failed to backup existing config: {}", e))?;
            }
            
            copy_recursive(&src, &dst)?;
        }
    }
    
    Ok(())
}

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

fn get_containers_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".nixdeck").join("containers")
}

fn get_container_path(name: &str) -> PathBuf {
    get_containers_dir().join(name)
}

fn get_snapshot_components() -> Vec<String> {
    vec![
        "waybar".to_string(),
        "polybar".to_string(),
        "eww".to_string(),
        "conky".to_string(),
        "kitty".to_string(),
        "alacritty".to_string(),
        "picom".to_string(),
        "dunst".to_string(),
        "rofi".to_string(),
        "gtk-3.0".to_string(),
        "gtk-4.0".to_string(),
    ]
}
