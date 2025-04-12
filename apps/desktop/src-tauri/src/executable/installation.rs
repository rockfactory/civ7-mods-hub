#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameInstallation {
    pub path: String,
    pub method: String,
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
                if let Ok(content) = fs::read_to_string(&library_folders) {
                    log::info!("Library folders content: {:?}", content);
                    if content.contains("\"1295660\"") {
                        log::info!("Found Civilization VII in Steam library folders");
                        return Ok(GameInstallation {
                            path: steam_path,
                            method: "Steam".to_string(),
                        });
                    }
                }
            }

            // Even if we don't find it in the library folders, we can still run it from the SteamID
            log::warn!("Civilization VII not found in Steam library folders, but we can still run it from the SteamID");
            return Ok(GameInstallation {
                method: "Steam".to_string(),
                path: String::new(),
            });
        }

        // Epic
        let epic_path = r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests";
        if let Ok(entries) = fs::read_dir(epic_path) {
            for entry in entries.flatten() {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    if content.contains("Civilization VII") {
                        return Ok(GameInstallation {
                            path: entry.path().display().to_string(),
                            method: "Epic".to_string(),
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

        // Steam default path
        let path = dirs::home_dir()
            .unwrap_or(PathBuf::from("/"))
            .join(".steam/steam/steamapps/common/Civilization VII");

        if path.exists() {
            return Ok(GameInstallation {
                path: path.display().to_string(),
                method: "Steam".to_string(),
            });
        }

        // Add logic for Lutris or Epic via Heroic
        Err("Civilization VII installation not found".into())
    }

    #[cfg(target_os = "macos")]
    {
        use std::path::PathBuf;

        let steam_path = dirs::home_dir()
            .unwrap()
            .join("Library/Application Support/Steam/steamapps/common/Civilization VII");

        if steam_path.exists() {
            return Ok(GameInstallation {
                path: steam_path.display().to_string(),
                method: "Steam".to_string(),
            });
        }

        Err("Civilization VII installation not found".into())
    }
}
