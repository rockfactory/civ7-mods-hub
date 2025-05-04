#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameInstallation {
    pub path: String,
    pub method: String,
    pub launch_url: Option<String>, // Optional URL for launching the game
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct EpicGameManifest {
    pub catalog_namespace: String,
    pub catalog_item_id: String,
    pub display_name: String,
    pub app_name: String,
}

fn get_steam_game_installation(
    steam_path: String,
    library_folders: String,
) -> Result<GameInstallation, String> {
    use std::fs;

    if let Ok(content) = fs::read_to_string(&library_folders) {
        if content.contains("\"1295660\"") {
            log::info!("Found Civilization VII in Steam library folders");
            return Ok(GameInstallation {
                path: steam_path,
                method: "Steam".to_string(),
                launch_url: Some("steam://rungameid/1295660".to_string()),
            });
        }

        return Err("Civilization VII installation not found in Steam library folders".into());
    }

    Err("Civilization VII installation not found".into())
}

#[tauri::command]
pub fn find_civ7_installation() -> Result<GameInstallation, String> {
    #[cfg(target_os = "windows")]
    {
        use std::fs;
        use winreg::enums::*;
        use winreg::RegKey;

        // Steam
        if let Ok(hkey) =
            RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey("SOFTWARE\\WOW6432Node\\Valve\\Steam")
        {
            log::info!("Found Steam installation at {:?}", hkey);
            if let Ok(steam_path) = hkey.get_value("InstallPath") {
                log::info!("Steam path: {:?}", steam_path);
                let library_folders = format!("{}\\steamapps\\libraryfolders.vdf", steam_path);

                match get_steam_game_installation(steam_path, library_folders) {
                    Ok(game_installation) => return Ok(game_installation),
                    Err(err) => log::info!("Cannot find Civ7 in Steam: {}", err),
                }
            }
        }

        // Epic
        let epic_path = r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests";
        if let Ok(entries) = fs::read_dir(epic_path) {
            for entry in entries.flatten() {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    let manifest: EpicGameManifest =
                        serde_json::from_str(&content).map_err(|_| {
                            log::error!("Failed to parse Epic game manifest: {}", content);
                            "Failed to parse Epic game manifest".to_string()
                        })?;

                    if manifest.display_name.contains("Civilization VII") {
                        log::info!("Found Civilization VII in Epic library folders");
                        return Ok(GameInstallation {
                            path: entry.path().display().to_string(),
                            method: "Epic".to_string(),
                            launch_url: Some(format!(
                                "com.epicgames.launcher://apps/{}%3A{}%3A{}?action=launch",
                                manifest.catalog_namespace,
                                manifest.catalog_item_id,
                                manifest.app_name
                            )),
                        });
                    }
                }
            }
        }

        // Fallback/custom
        Err("Civilization VII installation not found".into())
    }

    // TODO Check https://unix.stackexchange.com/questions/735211/how-to-get-steam-game-install-save-file-path-programmatically
    #[cfg(target_os = "linux")]
    {
        use std::path::PathBuf;

        let potential_library_paths = [
            ".steam/steam/steamapps/libraryfolders.vdf",
            ".steam/steam/config/libraryfolders.vdf",
            ".local/share/Steam/steamapps/libraryfolders.vdf",
        ];

        for library_path in potential_library_paths.iter() {
            let path = dirs::home_dir()
                .unwrap_or(PathBuf::from("/"))
                .join(library_path);

            if path.exists() {
                log::info!("Found Steam library folders at {:?}", path);
                match get_steam_game_installation(
                    path.display().to_string(),
                    path.display().to_string(),
                ) {
                    Ok(game_installation) => return Ok(game_installation),
                    Err(err) => log::info!(" Cannot find Civ7 in Steam: {}", err),
                }
            }
        }

        // Add logic for Lutris or Epic via Heroic
        Err("Civilization VII installation not found".into())
    }

    #[cfg(target_os = "macos")]
    {
        use std::path::PathBuf;

        let steam_path = dirs::home_dir()
            .unwrap_or(PathBuf::from("/"))
            .join("Library/Application Support/Steam/");
        let library_path = dirs::home_dir()
            .unwrap_or(PathBuf::from("/"))
            .join("Library/Application Support/Steam/steamapps/libraryfolders.vdf");

        if library_path.exists() {
            log::info!("Found Steam library folders at {:?}", library_path);
            match get_steam_game_installation(steam_path, library_path.display().to_string()) {
                Ok(game_installation) => return Ok(game_installation),
                Err(err) => log::info!("Cannot find Civ7 in Steam: {}", err),
            }
        }

        Err("Civilization VII installation not found".into())
    }
}
