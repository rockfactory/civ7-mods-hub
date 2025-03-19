use mods::{extract_archive, traversal::scan_civ_mods};
use tauri::Manager;
use tauri_plugin_fs::FsExt; // Important: new way to access fs plugin

mod mods;
use crate::mods::get_civ_mods_folder;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_mods_folder(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    let mods_folder = get_civ_mods_folder::get_civ7_mods_folder();

    // Dynamically grant read/write permission
    if mods_folder.is_some() {
        app_handle
            .fs_scope()
            .allow_directory(&mods_folder.as_ref().unwrap(), true)
            .map_err(|e| format!("Failed to grant permission: {}", e))?;
    }

    Ok(mods_folder.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
async fn extract_mod_archive(archive_path: &str, extract_to: &str) -> Result<(), String> {
    extract_archive::extract_archive(&archive_path, &extract_to)
        .map_err(|e| format!("Failed to extract archive: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()        
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} and the deep link event was already triggered");
            // when defining deep link schemes at runtime, you must also check `argv` here
            log::info!("argv: {:?}", argv);

          let _ = app.get_webview_window("main")
                       .expect("no main window")
                       .set_focus();
        }))
        .plugin(tauri_plugin_deep_link::init())
        .setup(|_app| { // prefix with _ to avoid unused variable warning in MacOS
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                _app.deep_link().register_all()?;
            }
            Ok(())
        })
        .plugin(
            tauri_plugin_log::Builder::new()
            .max_file_size(5_000_000) // 5MB in bytes
            .build(),
        )
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
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
