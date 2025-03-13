use mods::{extract_archive, traversal::scan_civ_mods};
use std::path::PathBuf;
use tauri::{plugin::TauriPlugin, Manager};
use tauri_plugin_fs::FsExt; // Important: new way to access fs plugin

mod mods;
use crate::mods::get_civ_mods_folder;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_mods_folder(app_handle: tauri::AppHandle) -> Result<String, String> {
    let mods_folder = get_civ_mods_folder::get_civ7_mods_folder().ok_or("Mods folder not found")?;

    // Dynamically grant read/write permission
    app_handle
        .fs_scope()
        .allow_directory(&mods_folder, true)
        .map_err(|e| format!("Failed to grant permission: {}", e))?;

    Ok(mods_folder.to_string_lossy().to_string())
}

#[tauri::command]
async fn extract_mod_archive(archive_path: &str, extract_to: &str) -> Result<(), String> {
    extract_archive::extract_archive(&archive_path, &extract_to)
        .map_err(|e| format!("Failed to extract archive: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_mods_folder,
            extract_mod_archive,
            scan_civ_mods
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
