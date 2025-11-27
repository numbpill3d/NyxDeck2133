// NixDeck 2133 - Daemon Management Module
use std::process::Command;

pub async fn list_services() -> Result<Vec<String>, String> {
    let output = Command::new("systemctl")
        .args(&["list-units", "--type=service", "--user", "--no-pager"])
        .output()
        .map_err(|e| format!("Failed to list services: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let services: Vec<String> = stdout
        .lines()
        .filter(|line| line.contains(".service"))
        .map(|line| line.to_string())
        .collect();

    Ok(services)
}

pub async fn create_service(name: String, content: String) -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let service_path = home.join(format!(".config/systemd/user/{}.service", name));
    
    // Ensure directory exists
    if let Some(parent) = service_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create systemd directory: {}", e))?;
    }
    
    std::fs::write(service_path, content)
        .map_err(|e| format!("Failed to write service file: {}", e))?;
    
    // Reload systemd daemon
    Command::new("systemctl")
        .args(&["--user", "daemon-reload"])
        .output()
        .map_err(|e| format!("Failed to reload systemd: {}", e))?;
    
    Ok(())
}

pub async fn enable_service(name: String) -> Result<(), String> {
    let output = Command::new("systemctl")
        .args(&["--user", "enable", &name])
        .output()
        .map_err(|e| format!("Failed to enable service: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

pub async fn disable_service(name: String) -> Result<(), String> {
    let output = Command::new("systemctl")
        .args(&["--user", "disable", &name])
        .output()
        .map_err(|e| format!("Failed to disable service: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

pub async fn start_service(name: String) -> Result<(), String> {
    let output = Command::new("systemctl")
        .args(&["--user", "start", &name])
        .output()
        .map_err(|e| format!("Failed to start service: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

pub async fn stop_service(name: String) -> Result<(), String> {
    let output = Command::new("systemctl")
        .args(&["--user", "stop", &name])
        .output()
        .map_err(|e| format!("Failed to stop service: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

pub async fn get_status(name: String) -> Result<String, String> {
    let output = Command::new("systemctl")
        .args(&["--user", "status", &name, "--no-pager"])
        .output()
        .map_err(|e| format!("Failed to get service status: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
