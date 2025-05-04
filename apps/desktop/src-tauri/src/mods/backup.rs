use fs_extra::dir::{copy, CopyOptions};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tokio::fs as async_fs;

/// Generates a unique identifier using the current timestamp (seconds since UNIX epoch).
fn generate_timestamp_string() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string() // Convert seconds to string
}

/// Creates a backup of a mod folder in the temp directory.
/// Returns the exact backup mod path.
#[tauri::command]
pub async fn backup_mod_to_temp(app: AppHandle, mod_path: String) -> Result<String, String> {
    let mod_path = PathBuf::from(&mod_path);
    if !mod_path.exists() || !mod_path.is_dir() {
        return Err("Invalid mod path: directory does not exist".to_string());
    }

    // Generate the temp backup directory path
    let temp_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|_| "Failed to get local data directory".to_string())?;
    log::info!("Temp directory: {:?}", temp_dir);

    // Create a unique timestamped folder
    let timestamp = generate_timestamp_string();
    let mod_name = mod_path
        .file_name()
        .ok_or("Failed to determine mod folder name")?
        .to_string_lossy()
        .to_string();

    let backup_parent_folder = temp_dir
        .join("backups")
        .join(format!("{}_{}", mod_name, timestamp));
    let temp_backup_path = backup_parent_folder.join(&mod_name); // Store the mod inside
    log::info!("Temp Backup path: {:?}", temp_backup_path);

    // Create backup folder structure
    async_fs::create_dir_all(&backup_parent_folder)
        .await
        .map_err(|e| format!("Failed to create backup folder: {}", e))?;

    // Copy the mod folder into the backup subdirectory
    let mut options = CopyOptions::new();
    options.overwrite = true;
    options.copy_inside = true;

    let copy_result = copy(&mod_path, &temp_backup_path, &options);

    // If copying fails, remove the backup folder
    if let Err(e) = copy_result {
        async_fs::remove_dir_all(&backup_parent_folder).await.ok(); // Ignore errors while deleting
        return Err(format!("Failed to copy mod to temp: {}", e));
    }

    Ok(temp_backup_path.to_string_lossy().to_string()) // ✅ Return the mod_backup_path directly
}

/// Restores a mod from the temp backup back to its original mods directory.
/// After restoring, the backup folder (parent of `temp_backup_path`) is deleted with
/// the cleanup_mod_backup command.
#[tauri::command]
pub async fn restore_mod_from_temp(
    _app: AppHandle,
    mod_restore_path: String,
    temp_backup_path: String, // Now this is the exact mod path
) -> Result<(), String> {
    let mod_restore_folder = PathBuf::from(&mod_restore_path);
    let mod_backup_path = PathBuf::from(&temp_backup_path);

    if !mod_backup_path.exists() || !mod_backup_path.is_dir() {
        return Err("Invalid temp mod path: directory does not exist".to_string());
    }

    // Remove existing mod folder before restoring (to prevent conflicts)
    if mod_restore_folder.exists() {
        async_fs::remove_dir_all(&mod_restore_folder)
            .await
            .map_err(|e| format!("Failed to remove existing mod folder: {}", e))?;
    }

    async_fs::create_dir_all(&mod_restore_folder)
        .await
        .map_err(|e| format!("Failed to create mod restore folder: {}", e))?;

    // Restore the mod from the exact backup folder
    let mut options = CopyOptions::new();
    options.overwrite = true;
    options.copy_inside = true;

    let copy_result = copy(&mod_backup_path, &mod_restore_folder, &options);

    if let Err(e) = copy_result {
        return Err(format!("Failed to restore mod from temp: {}", e));
    }

    Ok(())
}

/// Removes a specific backup from the temporary directory.
#[tauri::command]
pub async fn cleanup_mod_backup(_app: AppHandle, temp_backup_path: String) -> Result<(), String> {
    let backup_path = PathBuf::from(temp_backup_path);
    if !backup_path.exists() {
        return Ok(()); // Backup folder does not exist, nothing to do
    }

    // Only delete the parent if it exists
    if let Some(backup_parent) = backup_path.parent() {
        if let Err(err) = async_fs::remove_dir_all(backup_parent).await {
            log::warn!(
                "Failed to remove backup parent folder {}: {}",
                backup_parent.display(),
                err
            );
        }
    }

    Ok(())
}
