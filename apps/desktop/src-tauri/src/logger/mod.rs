pub fn redact_path_for_logs(input: &str) -> String {
    use std::env;

    let mut redacted = input.to_string().replace("\\\\", "\\");

    if let Some(home) = dirs::home_dir() {
        let home_str = home.to_string_lossy();

        #[cfg(windows)]
        {
            if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
                redacted = redacted.replace(&local_app_data, "%LocalAppData%");
            }
            if let Ok(app_data) = env::var("APPDATA") {
                redacted = redacted.replace(&app_data, "%AppData%");
            }

            if let Ok(user_profile) = env::var("USERPROFILE") {
                redacted = redacted.replace(&user_profile, "%UserProfile%");
            } else {
                redacted = redacted.replace(&*home_str, "%UserProfile%");
            }
        }

        #[cfg(not(windows))]
        {
            redacted = redacted.replace(&*home_str, "~");
        }
    }

    redacted
}

// As a tauri command
#[tauri::command]
pub fn redact_path(path: String) -> String {
    redact_path_for_logs(&path)
}
