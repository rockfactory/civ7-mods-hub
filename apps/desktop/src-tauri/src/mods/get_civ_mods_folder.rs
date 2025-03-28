use dirs::home_dir;
use std::env::consts::OS;
use std::path::PathBuf;

pub fn get_civ7_mods_folder() -> Option<PathBuf> {
    let home = home_dir()?;

    let mods_path = match OS {
        "windows" => home
            .join("AppData")
            .join("Local")
            .join("Firaxis Games")
            .join("Sid Meier's Civilization VII")
            .join("Mods"),
        "macos" => home
            .join("Library")
            .join("Application Support")
            .join("Civilization VII")
            .join("Mods"),
        "linux" => home
            .join("My Games")
            .join("Sid Meier's Civilization VII")
            .join("Mods"),
        _ => return None,
    };

    if mods_path.exists() {
        Some(mods_path)
    } else {
        None
    }
}
