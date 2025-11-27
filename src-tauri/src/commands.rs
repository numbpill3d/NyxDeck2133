// NixDeck 2133 - Tauri Command Handlers
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub hostname: String,
    pub kernel: String,
    pub distro: String,
    pub uptime: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

// ============================================================================
// SYSTEM COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    let hostname = execute_shell_command("hostname").await?;
    let kernel = execute_shell_command("uname -r").await?;
    let distro = execute_shell_command("cat /etc/os-release | grep PRETTY_NAME | cut -d '=' -f2 | tr -d '\"'").await?;
    let uptime = execute_shell_command("uptime -p").await?;

    Ok(SystemInfo {
        hostname: hostname.trim().to_string(),
        kernel: kernel.trim().to_string(),
        distro: distro.trim().to_string(),
        uptime: uptime.trim().to_string(),
    })
}

#[tauri::command]
pub async fn execute_command(command: String) -> Result<CommandResult, String> {
    let output = Command::new("sh")
        .arg("-c")
        .arg(&command)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    Ok(CommandResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
pub async fn read_config_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file {}: {}", path, e))
}

#[tauri::command]
pub async fn write_config_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write file {}: {}", path, e))
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<String>, String> {
    let entries = std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory {}: {}", path, e))?;

    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(name) = entry.file_name().to_str() {
                files.push(name.to_string());
            }
        }
    }

    Ok(files)
}

// ============================================================================
// AI COMMANDS
// ============================================================================

#[tauri::command]
pub async fn send_ai_message(message: String, loadout: String) -> Result<String, String> {
    crate::ai::send_message(message, loadout).await
}

#[tauri::command]
pub async fn load_ai_loadout(name: String) -> Result<String, String> {
    crate::ai::load_loadout(name).await
}

#[tauri::command]
pub async fn save_ai_loadout(name: String, config: String) -> Result<(), String> {
    crate::ai::save_loadout(name, config).await
}

#[tauri::command]
pub async fn list_ai_loadouts() -> Result<Vec<String>, String> {
    crate::ai::list_loadouts().await
}

// ============================================================================
// RICE COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_rice_config(component: String) -> Result<String, String> {
    crate::rice::get_config(component).await
}

#[tauri::command]
pub async fn apply_rice_config(component: String, config: String) -> Result<(), String> {
    crate::rice::apply_config(component, config).await
}

#[tauri::command]
pub async fn preview_rice_config(component: String, config: String) -> Result<String, String> {
    crate::rice::preview_config(component, config).await
}

// ============================================================================
// DAEMON COMMANDS
// ============================================================================

#[tauri::command]
pub async fn list_systemd_services() -> Result<Vec<String>, String> {
    crate::daemon::list_services().await
}

#[tauri::command]
pub async fn create_systemd_service(name: String, content: String) -> Result<(), String> {
    crate::daemon::create_service(name, content).await
}

#[tauri::command]
pub async fn enable_systemd_service(name: String) -> Result<(), String> {
    crate::daemon::enable_service(name).await
}

#[tauri::command]
pub async fn disable_systemd_service(name: String) -> Result<(), String> {
    crate::daemon::disable_service(name).await
}

#[tauri::command]
pub async fn start_systemd_service(name: String) -> Result<(), String> {
    crate::daemon::start_service(name).await
}

#[tauri::command]
pub async fn stop_systemd_service(name: String) -> Result<(), String> {
    crate::daemon::stop_service(name).await
}

#[tauri::command]
pub async fn get_service_status(name: String) -> Result<String, String> {
    crate::daemon::get_status(name).await
}

// ============================================================================
// CRON COMMANDS
// ============================================================================

#[tauri::command]
pub async fn list_cron_jobs() -> Result<Vec<String>, String> {
    crate::cron_mod::list_jobs().await
}

#[tauri::command]
pub async fn create_cron_job(schedule: String, command: String) -> Result<(), String> {
    crate::cron_mod::create_job(schedule, command).await
}

#[tauri::command]
pub async fn delete_cron_job(id: String) -> Result<(), String> {
    crate::cron_mod::delete_job(id).await
}

// ============================================================================
// CONTAINER COMMANDS
// ============================================================================

#[tauri::command]
pub async fn create_container(name: String) -> Result<(), String> {
    crate::container::create(name).await
}

#[tauri::command]
pub async fn load_container(name: String) -> Result<(), String> {
    crate::container::load(name).await
}

#[tauri::command]
pub async fn list_containers() -> Result<Vec<String>, String> {
    crate::container::list().await
}

#[tauri::command]
pub async fn delete_container(name: String) -> Result<(), String> {
    crate::container::delete(name).await
}

#[tauri::command]
pub async fn export_container(name: String, path: String) -> Result<(), String> {
    crate::container::export(name, path).await
}

// ============================================================================
// SAFETY COMMANDS
// ============================================================================

#[tauri::command]
pub async fn create_snapshot(name: String) -> Result<(), String> {
    crate::safety::create_snapshot(name).await
}

#[tauri::command]
pub async fn list_snapshots() -> Result<Vec<String>, String> {
    crate::safety::list_snapshots().await
}

#[tauri::command]
pub async fn restore_snapshot(name: String) -> Result<(), String> {
    crate::safety::restore_snapshot(name).await
}

#[tauri::command]
pub async fn delete_snapshot(name: String) -> Result<(), String> {
    crate::safety::delete_snapshot(name).await
}

// ============================================================================
// THEME COMMANDS
// ============================================================================

#[tauri::command]
pub async fn list_themes() -> Result<Vec<String>, String> {
    crate::theme::list_themes().await
}

#[tauri::command]
pub async fn load_theme(name: String) -> Result<String, String> {
    crate::theme::load_theme(name).await
}

#[tauri::command]
pub async fn save_theme(name: String, content: String) -> Result<(), String> {
    crate::theme::save_theme(name, content).await
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async fn execute_shell_command(command: &str) -> Result<String, String> {
    let output = Command::new("sh")
        .arg("-c")
        .arg(command)
        .output()
        .map_err(|e| format!("Command execution failed: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
