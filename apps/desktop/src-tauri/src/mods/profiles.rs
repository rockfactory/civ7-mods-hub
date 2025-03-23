use fs_extra::dir::{copy, CopyOptions};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tokio::fs as async_fs;

use crate::mods::extract_archive::recursively_grant_write_permissions;

use super::traversal::get_unlocked_mod_folders;

/// Lists all profile folders inside the "profiles" directory in appData.
#[tauri::command]
pub async fn list_profiles(app: AppHandle) -> Result<Vec<String>, String> {
    // Get the app_data directory
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|_e| "Failed to get appData directory")?;

    // Define the profiles directory inside appData
    let profiles_dir = app_data.join("profiles");

    // Ensure the profiles directory exists
    if !profiles_dir.exists() || !profiles_dir.is_dir() {
        return Ok(vec![]); // Return an empty list if the directory doesn't exist
    }

    // Read subdirectories (profiles)
    let entries = fs::read_dir(&profiles_dir)
        .map_err(|e| format!("Failed to read profiles directory: {}", e))?;

    log::info!("Listing profiles in directory: {:?}", profiles_dir);

    let mut profile_names = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        // Only include directories (ignore files)
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                log::info!(" Found profile: {}", name);
                profile_names.push(name.to_string());
            }
        }
    }

    Ok(profile_names)
}

/// Copies selected mods to a profile, then removes them from the mods folder if `cleanup` is true.
#[tauri::command]
pub async fn copy_mods_to_profile(
    app: AppHandle,
    mods_folder_path: Option<String>,
    profile_folder_name: String,
    locked_ids: Vec<String>, // Locked modinfo IDs to exclude from copying
    cleanup: bool,           // If true, remove the specified mods AFTER copying
) -> Result<(), String> {
    // Get the app_data directory
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|_e| "Failed to get appData directory")?;

    // Ensure the mods folder path is provided
    let mods_folder_path = mods_folder_path.ok_or("Mods folder path is required")?;

    // Define the target profile directory
    let profile_dir = app_data.join("profiles").join(&profile_folder_name);

    if profile_dir.exists() {
        log::info!("Clearing existing profile directory: {:?}", profile_dir);
        async_fs::remove_dir_all(&profile_dir)
            .await
            .map_err(|e| format!("Failed to clear existing profile directory: {}", e))?;
    }

    // Ensure the profile directory exists
    async_fs::create_dir_all(&profile_dir)
        .await
        .map_err(|e| format!("Failed to create profile directory: {}", e))?;

    log::info!("Copying mods into profile folder path: {:?}", profile_dir);

    let mod_base_path = PathBuf::from(&mods_folder_path);
    log::info!("Mods folder path: {:?}", mod_base_path);

    let mod_folder_names = get_unlocked_mod_folders(Some(mods_folder_path), locked_ids)?;

    for mod_name in &mod_folder_names {
        let mod_source = mod_base_path.join(&mod_name);
        let mod_target = profile_dir.join(&mod_name);

        // Ensure the source folder exists
        if !mod_source.exists() || !mod_source.is_dir() {
            return Err(format!(
                "Mod folder '{}' does not exist or is not a directory",
                mod_name
            ));
        }

        // Copy the mod folder to the profile directory
        let mut options = CopyOptions::new();
        options.overwrite = true;
        options.copy_inside = true;

        // recursively_grant_write_permissions(&mod_source)
        //     .map_err(|e| format!("Failed to grant write permissions: {}", e))?;

        copy(&mod_source, &mod_target, &options)
            .map_err(|e| format!("Failed to copy mod '{}': {}", mod_name, e))?;
    }

    // Perform cleanup AFTER copying
    if cleanup {
        for mod_name in &mod_folder_names {
            let mod_target = mod_base_path.join(mod_name);

            // Remove only the specified mods
            if mod_target.exists() && mod_target.is_dir() {
                async_fs::remove_dir_all(&mod_target)
                    .await
                    .map_err(|e| format!("Failed to remove mod '{}': {}", mod_name, e))?;
            }
        }
    }

    Ok(())
}

/// Restores all mods from a profile directory to the main mods folder.
#[tauri::command]
pub async fn restore_mods_from_profile(
    app: AppHandle,
    mods_folder_path: String,
    profile_folder_name: String,
    dry_run: bool, // If true, don't actually copy the mods
) -> Result<(), String> {
    // Get the app_data directory
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|_e| "Failed to get appData directory")?;

    // Define the source profile directory
    let profile_dir = app_data.join("profiles").join(&profile_folder_name);

    // Ensure the profile directory exists
    if !profile_dir.exists() || !profile_dir.is_dir() {
        return Err(format!(
            "Profile folder '{}' does not exist or is not a directory",
            profile_folder_name
        ));
    }

    log::info!("Restoring mods from profile folder path: {:?}", profile_dir);

    let mod_base_path = PathBuf::from(&mods_folder_path);

    // Read all subdirectories in the profile directory
    let mod_entries = fs::read_dir(&profile_dir)
        .map_err(|e| format!("Failed to read profile directory: {}", e))?;

    for entry in mod_entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let mod_source = entry.path();

        // Only copy directories (mods)
        if mod_source.is_dir() {
            let mod_name = mod_source
                .file_name()
                .ok_or("Failed to extract mod name")?
                .to_string_lossy()
                .to_string();

            let mod_target = mod_base_path.join(&mod_name);

            if dry_run {
                continue;
            }

            // Copy the mod folder back to the mods directory
            let mut options = CopyOptions::new();
            options.overwrite = true;
            options.copy_inside = true;

            copy(&mod_source, &mod_target, &options)
                .map_err(|e| format!("Failed to copy mod '{}': {}", mod_name, e))?;
        }
    }

    Ok(())
}

/// Deletes a profile folder and all its contents.
/// This is a destructive operation and cannot be undone.
#[tauri::command]
pub async fn delete_profile(app: AppHandle, profile_folder_name: String) -> Result<(), String> {
    // Get the app_data directory
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|_e| "Failed to get appData directory")?;

    // Define the target profile directory
    let profile_dir = app_data.join("profiles").join(&profile_folder_name);

    // Ensure the profile directory exists
    if !profile_dir.exists() || !profile_dir.is_dir() {
        return Err(format!(
            "Profile folder '{}' does not exist or is not a directory",
            profile_folder_name
        ));
    }

    log::info!("Deleting profile folder: {:?}", profile_dir);

    async_fs::remove_dir_all(&profile_dir)
        .await
        .map_err(|e| format!("Failed to delete profile folder: {}", e))?;

    Ok(())
}

/// Creates an empty profile in the profiles directory.
#[tauri::command]
pub async fn create_empty_profile(
    app: AppHandle,
    profile_folder_name: String,
) -> Result<(), String> {
    // Get the app_data directory
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get appData directory".to_string())?;

    // Define the profile directory path
    let profile_dir = app_data.join("profiles").join(&profile_folder_name);

    // Check if the profile already exists
    if profile_dir.exists() {
        return Err(format!("Profile '{}' already exists", profile_folder_name));
    }

    // Create the empty profile directory
    async_fs::create_dir_all(&profile_dir)
        .await
        .map_err(|e| format!("Failed to create profile directory: {}", e))?;

    Ok(())
}
