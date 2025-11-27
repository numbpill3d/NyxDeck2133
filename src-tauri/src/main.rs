// NixDeck 2133 - Main Application Entry Point
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::fs;
use std::path::PathBuf;

// Module declarations
mod ai;
mod rice;
mod daemon;
mod cron_mod;
mod container;
mod safety;
mod theme;
mod commands;

use commands::*;

fn main() {
    // Initialize NixDeck configuration directory
    let config_dir = get_config_dir();
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).expect("Failed to create NixDeck config directory");
    }

    // Initialize snapshots directory
    let snapshots_dir = config_dir.join("snapshots");
    if !snapshots_dir.exists() {
        fs::create_dir_all(&snapshots_dir).expect("Failed to create snapshots directory");
    }

    // Initialize loadouts directory
    let loadouts_dir = config_dir.join("loadouts");
    if !loadouts_dir.exists() {
        fs::create_dir_all(&loadouts_dir).expect("Failed to create loadouts directory");
    }

    tauri::Builder::default()
        .setup(|app| {
            // Set window properties
            let window = app.get_window("main").unwrap();
            window.set_title("NixDeck 2133 - BLACKSITE PROTOCOL ACTIVE").ok();
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // System commands
            get_system_info,
            execute_command,
            read_config_file,
            write_config_file,
            list_directory,
            
            // AI commands
            send_ai_message,
            load_ai_loadout,
            save_ai_loadout,
            list_ai_loadouts,
            
            // Rice commands
            get_rice_config,
            apply_rice_config,
            preview_rice_config,
            
            // Daemon commands
            list_systemd_services,
            create_systemd_service,
            enable_systemd_service,
            disable_systemd_service,
            start_systemd_service,
            stop_systemd_service,
            get_service_status,
            
            // Cron commands
            list_cron_jobs,
            create_cron_job,
            delete_cron_job,
            
            // Container commands
            create_container,
            load_container,
            list_containers,
            delete_container,
            export_container,
            
            // Safety commands
            create_snapshot,
            list_snapshots,
            restore_snapshot,
            delete_snapshot,
            
            // Theme commands
            list_themes,
            load_theme,
            save_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NixDeck 2133");
}

// Helper function to get config directory
fn get_config_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".nixdeck")
}
