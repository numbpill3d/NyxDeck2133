// NixDeck 2133 - Theme Management Module
use std::path::PathBuf;
use std::fs;

pub async fn list_themes() -> Result<Vec<String>, String> {
    let themes_dir = get_themes_dir();
    
    if !themes_dir.exists() {
        fs::create_dir_all(&themes_dir)
            .map_err(|e| format!("Failed to create themes directory: {}", e))?;
        return Ok(vec!["blacksite".to_string()]); // Default theme
    }
    
    let entries = fs::read_dir(themes_dir)
        .map_err(|e| format!("Failed to read themes directory: {}", e))?;
    
    let mut themes = vec!["blacksite".to_string()]; // Always include default
    
    for entry in entries {
        if let Ok(entry) = entry {
            if entry.path().is_dir() {
                if let Some(name) = entry.file_name().to_str() {
                    if name != "blacksite" {
                        themes.push(name.to_string());
                    }
                }
            }
        }
    }
    
    Ok(themes)
}

pub async fn load_theme(name: String) -> Result<String, String> {
    let theme_css_path = if name == "blacksite" {
        // Default theme is in src/styles
        PathBuf::from("../src/styles/blacksite.css")
    } else {
        get_theme_path(&name).join("style.css")
    };
    
    if !theme_css_path.exists() {
        return Err(format!("Theme '{}' not found", name));
    }
    
    fs::read_to_string(theme_css_path)
        .map_err(|e| format!("Failed to read theme: {}", e))
}

pub async fn save_theme(name: String, content: String) -> Result<(), String> {
    if name == "blacksite" {
        return Err("Cannot overwrite default theme".to_string());
    }
    
    let theme_dir = get_theme_path(&name);
    
    fs::create_dir_all(&theme_dir)
        .map_err(|e| format!("Failed to create theme directory: {}", e))?;
    
    let theme_css_path = theme_dir.join("style.css");
    
    fs::write(theme_css_path, content)
        .map_err(|e| format!("Failed to write theme: {}", e))
}

fn get_themes_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".nixdeck").join("themes")
}

fn get_theme_path(name: &str) -> PathBuf {
    get_themes_dir().join(name)
}
