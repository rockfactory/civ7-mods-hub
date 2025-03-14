use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::fs::{self};
use std::io::Read;
use std::path::Path;
use walkdir::WalkDir;
#[derive(Serialize)]
pub struct ModInfo {
    mod_name: String,
    modinfo_path: Option<String>,
    modinfo_id: Option<String>, // Extracted from XML <Mod id="...">
    folder_hash: String,
    folder_name: String,
}

/// XML struct for parsing .modinfo using serde
#[derive(Debug, Deserialize)]
#[serde(rename = "Mod")]
struct ModXml {
    #[serde(rename = "@id")]
    id: Option<String>,
}

/// Computes SHA-256 hash of all files inside a directory,
/// including the filename and relative path in the hash.
fn compute_folder_hash(directory: &Path) -> Result<String, String> {
    let mut hasher = Sha256::new();

    log::info!("Computing hash for: {}", directory.to_str().unwrap());
    let iter = WalkDir::new(directory)
        .sort_by_file_name()
        .into_iter()
        .filter_map(Result::ok);

    for entry in iter {
        if entry.file_type().is_file() {
            log::info!(" -> Hashing: {}", entry.path().display());
            // Skipping file name for now.

            if entry.file_name().to_string_lossy().starts_with(".") {
                continue;
            }

            // Get relative path (relative to the given directory)
            // let relative_path = entry
            //     .path()
            //     .strip_prefix(directory)
            //     .map_err(|e| format!("Failed to get relative path: {}", e))?
            //     .to_string_lossy();

            // // Update the hash with the relative path
            // hasher.update(relative_path.as_bytes());
            // println!("Hashing: {}", relative_path);

            // Read file content and update hash
            let mut file =
                File::open(entry.path()).map_err(|e| format!("Failed to open file: {}", e))?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)
                .map_err(|e| format!("Failed to read file: {}", e))?;
            hasher.update(&buffer);
        }
    }

    let hash_result = hasher.finalize();
    Ok(format!("{:x}", hash_result))
}

/// Parses the .modinfo XML and extracts the `id` attribute
fn extract_mod_id(modinfo_path: &str) -> Option<String> {
    let xml_content = fs::read_to_string(modinfo_path).ok()?;
    let parsed: Result<ModXml, _> = quick_xml::de::from_str(&xml_content);

    parsed.ok()?.id
}

/// Finds the `.modinfo` file inside a given directory.
pub fn find_modinfo_file(directory: &Path) -> (Option<String>, Option<String>) {
    for entry in WalkDir::new(directory)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| {
            e.file_type().is_file()
                && e.path()
                    .extension()
                    .map(|ext| ext == "modinfo")
                    .unwrap_or(false)
                && e.path()
                    .file_name()
                    .map(|name| !name.to_string_lossy().starts_with('.'))
                    .unwrap_or(true) // Defaults to true if there's no filename
        })
    {
        let modinfo_path = entry.path().to_string_lossy().to_string();
        let mod_id = extract_mod_id(&modinfo_path);
        return (Some(modinfo_path), mod_id);
    }
    (None, None)
}

/// Scans the Civ7 Mods directory and returns a list of `ModInfo`.
#[tauri::command]
pub async fn scan_civ_mods(mods_folder_path: String) -> Result<Vec<ModInfo>, String> {
    let mods_folder = Path::new(&mods_folder_path);
    if !mods_folder.exists() || !mods_folder.is_dir() {
        return Err("Invalid Mods folder path".to_string());
    }

    let mut mods_list = Vec::new();

    for entry in
        fs::read_dir(mods_folder).map_err(|e| format!("Failed to read mods directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let mod_dir = entry.path();

        if mod_dir.is_dir() {
            let mod_name = entry
                .file_name()
                .into_string()
                .unwrap_or_else(|_| "Unknown Mod".to_string());
            let (modinfo_path, modinfo_id) = find_modinfo_file(&mod_dir);
            let modinfo_path_str = modinfo_path.as_deref().ok_or("Modinfo not found")?;
            let modinfo_folder = Path::new(modinfo_path_str)
                .parent()
                .ok_or("Invalid modinfo path")?;

            let folder_hash = compute_folder_hash(&modinfo_folder)
                .unwrap_or_else(|_| "Error computing hash".to_string());

            mods_list.push(ModInfo {
                mod_name,
                modinfo_path,
                modinfo_id,
                folder_hash,
                // Only the folder name without the full path
                folder_name: mod_dir.file_name().unwrap().to_string_lossy().to_string(),
            });
        }
    }

    Ok(mods_list)
}
