use sysinfo::{ProcessRefreshKind, RefreshKind};

use super::installation::GameInstallation;

static CIV7_STEAM_ID: &str = "1295660"; // Replace with actual Civ 7 ID

#[tauri::command]
pub fn launch_civ7(installation: GameInstallation) -> Result<(), String> {
    match installation.method.as_str() {
        "Steam" => {
            log::info!("Launching Civilization VII via Steam");
            open::that(format!("steam://rungameid/{}", CIV7_STEAM_ID))
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        "Epic" => {
            log::info!("Launching Civilization VII via Epic Games Launcher");
            // Ideally get the app name from manifest and use Epic's URI scheme
            open::that("com.epicgames.launcher://apps/CivilizationVII?action=launch")
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        _ => Err("Unsupported installation method".into()),
    }
}

#[tauri::command]
pub fn is_civ7_running() -> Result<bool, String> {
    use sysinfo::System;

    // Create a new System instance and refresh only processes
    let mut system = System::new_with_specifics(
        RefreshKind::nothing().with_processes(ProcessRefreshKind::everything()), // Only refresh processes
    );
    system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    // Normalize the name you're searching for
    let target_names = [
        "CivilizationVII", // likely executable name
        "CivVII",          // possible shorthand
        "Civ7",
    ];

    // Check all processes
    let is_running = system.processes().values().any(|proc| {
        let name_lossy = proc.name().to_string_lossy();
        let name = name_lossy.to_ascii_lowercase();
        target_names
            .iter()
            .any(|&target| name.contains(&target.to_lowercase()))
    });

    Ok(is_running)
}
