// NixDeck 2133 - Ricing Control Module
use std::path::PathBuf;

pub async fn get_config(component: String) -> Result<String, String> {
    let config_path = get_component_config_path(&component)?;
    
    std::fs::read_to_string(config_path)
        .map_err(|e| format!("Failed to read {} config: {}", component, e))
}

pub async fn apply_config(component: String, config: String) -> Result<(), String> {
    let config_path = get_component_config_path(&component)?;
    
    // Create snapshot before applying
    let backup_path = format!("{}.nixdeck-backup", config_path.display());
    std::fs::copy(&config_path, &backup_path)
        .map_err(|e| format!("Failed to create backup: {}", e))?;
    
    std::fs::write(config_path, config)
        .map_err(|e| format!("Failed to write {} config: {}", component, e))
}

pub async fn preview_config(component: String, config: String) -> Result<String, String> {
    // Return a diff-like preview
    let current = get_config(component.clone()).await?;
    Ok(format!("=== CURRENT ===\n{}\n\n=== NEW ===\n{}", current, config))
}

fn get_component_config_path(component: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let config_base = home.join(".config");
    
    let path = match component {
        "waybar" => config_base.join("waybar/config"),
        "polybar" => config_base.join("polybar/config.ini"),
        "eww" => config_base.join("eww/eww.yuck"),
        "conky" => config_base.join("conky/conky.conf"),
        "kitty" => config_base.join("kitty/kitty.conf"),
        "alacritty" => config_base.join("alacritty/alacritty.yml"),
        "picom" => config_base.join("picom/picom.conf"),
        "dunst" => config_base.join("dunst/dunstrc"),
        "rofi" => config_base.join("rofi/config.rasi"),
        _ => return Err(format!("Unknown component: {}", component)),
    };
    
    Ok(path)
}
