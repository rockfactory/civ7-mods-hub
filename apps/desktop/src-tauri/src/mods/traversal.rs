use quick_xml::de::Text;
use quick_xml::escape;
use quick_xml::events::BytesText;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::borrow::Cow;
use std::fs::{self, File};
use std::io::{BufReader, Read, Write};
use std::path::Path;
use walkdir::WalkDir;

use crate::mods::patch_modinfo::restore_patched_modinfo_xml;

#[derive(Serialize)]
pub struct ModInfo {
    mod_name: String,
    modinfo_path: String,
    modinfo_id: Option<String>, // Extracted from XML <Mod id="...">
    folder_hash: String,
    folder_name: String,
    civmods_internal_version_id: Option<String>,
}

/// XML struct for parsing .modinfo using serde
#[derive(Debug, Deserialize)]
#[serde(rename = "Mod")]
pub struct ModXml {
    #[serde(rename = "@id")]
    pub id: Option<String>,
    #[serde(rename = "Properties")]
    pub properties: Properties,
}

// Using this temporarly until we get the `modinfo-parser` lib integrated
#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct Properties {
    pub civ_mods_internal_version_id: Option<String>,
}

// Make sure this is aligned with the ignore list in the backend in Node.js
fn is_entry_hidden(entry: &walkdir::DirEntry) -> bool {
    let file_name = entry.file_name().to_string_lossy();
    return file_name.starts_with(".")
        || file_name.eq_ignore_ascii_case("__MACOSX")
        || file_name.eq_ignore_ascii_case("thumbs.db");
}

/// Computes SHA-256 hash of all files inside a directory,
/// including the filename and relative path in the hash.
fn compute_folder_hash(directory: &Path) -> Result<String, String> {
    let mut hasher = Sha256::new();

    log::info!("Computing hash for: {}", directory.to_str().unwrap());
    let iter = WalkDir::new(directory)
        .sort_by(|a, b| {
            a.file_name()
                .to_string_lossy()
                .to_lowercase()
                .cmp(&b.file_name().to_string_lossy().to_lowercase())
        })
        .into_iter()
        .filter_entry(|e| !is_entry_hidden(e))
        .filter_map(Result::ok);

    for entry in iter {
        if entry.file_type().is_file() {
            let path = entry.path();

            // Try to restore unpatched version if it's a .modinfo file
            let content: Vec<u8> = if path.extension().map_or(false, |ext| ext == "modinfo") {
                match restore_patched_modinfo_xml(path)? {
                    Some(reverted) => reverted,
                    None => read_file_to_vec(path)?,
                }
            } else {
                read_file_to_vec(path)?
            };

            hasher.update(&content);
        }
    }

    let hash_result = hasher.finalize();
    log::debug!("Hash result for {}: {:x}", directory.display(), hash_result);
    Ok(format!("{:x}", hash_result))
}

fn read_file_to_vec(path: &Path) -> Result<Vec<u8>, String> {
    let mut buffer = Vec::new();
    File::open(path)
        .map_err(|e| format!("Failed to open file: {e}"))?
        .read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read file: {e}"))?;
    Ok(buffer)
}

/// Parses the .modinfo XML and extracts the `id` attribute
fn extract_mod_xml(modinfo_path: &str) -> Option<ModXml> {
    let mut buffer = vec![];
    sanitize_xml(File::open(modinfo_path).ok()?, &mut buffer).ok()?;
    let sanitized = String::from_utf8_lossy(&buffer).to_string();

    let mod_xml: Result<ModXml, _> = quick_xml::de::from_str(&sanitized);
    match mod_xml {
        Ok(xml) => Some(xml),
        Err(err) => {
            log::error!("Failed to parse modinfo XML: {err}");
            None
        }
    }
}

fn sanitize_xml(reader: impl Read, writer: impl Write) -> quick_xml::Result<()> {
    use quick_xml::{
        errors::{Error, IllFormedError},
        events::{BytesEnd, Event},
        Reader, Writer,
    };

    let mut reader = Reader::from_reader(BufReader::new(reader));
    let mut writer = Writer::new(writer);

    let mut buffer = Vec::new();
    loop {
        let event = match reader.read_event_into(&mut buffer) {
            Ok(Event::Eof) => return Ok(()),
            Ok(Event::Text(text)) => {
                // If we fail to unescape, it means it's not a valid XML text node
                // and we should escape it instead.
                let unescaped = text.unescape().unwrap_or_else(|_| {
                    Cow::Owned(String::from_utf8_lossy(&text.into_inner()).to_string())
                });

                let escaped = escape::escape(unescaped);
                let bytes_text = BytesText::from_escaped(escaped.into_owned());
                Event::Text(bytes_text)
            }
            Ok(event) => event,
            Err(Error::IllFormed(IllFormedError::MismatchedEndTag { expected, found })) => {
                log::warn!("Mismatched end tag: expected: {expected:?}, found: {found:?}");
                Event::End(BytesEnd::new(expected))
            }
            Err(Error::IllFormed(IllFormedError::MissingEndTag(tag))) => {
                log::warn!("Missing end tag: {tag:?}");
                Event::End(BytesEnd::new(tag))
            }
            Err(Error::IllFormed(IllFormedError::UnmatchedEndTag(tag))) => {
                log::warn!("Unmatched end tag: {tag:?}");
                Event::End(BytesEnd::new(tag))
            }
            Err(err) => return Err(err),
        };
        writer.write_event(event)?;
        buffer.clear();
    }
}

/// Finds the `.modinfo` file inside a given directory.
pub fn find_modinfo_file(directory: &Path) -> (Option<String>, Option<ModXml>) {
    if let Some(entry) = WalkDir::new(directory)
        .into_iter()
        .filter_map(Result::ok)
        .find(|e| {
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
        let mod_xml = extract_mod_xml(&modinfo_path);
        return (Some(modinfo_path), mod_xml);
    }
    (None, None)
}

/// Scans the Civ7 Mods directory and returns a list of `ModInfo`.
#[tauri::command]
pub fn scan_civ_mods(mods_folder_path: Option<String>) -> Result<Vec<ModInfo>, String> {
    if mods_folder_path.is_none() {
        return Err("Mods folder path is missing. Set it in the Settings".to_string());
    }

    let mods_folder = Path::new(mods_folder_path.as_ref().unwrap());
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
            let (modinfo_path, modinfo_xml) = find_modinfo_file(&mod_dir);

            // Skip mod if modinfo file is not found
            let modinfo_path_str = match modinfo_path.as_deref() {
                Some(path) => path,
                None => {
                    log::info!("Skipping mod folder without modinfo: {}", mod_name);
                    continue;
                }
            };

            let modinfo_folder = Path::new(modinfo_path_str)
                .parent()
                .ok_or("Invalid modinfo path")?;

            let folder_hash = compute_folder_hash(modinfo_folder)
                .unwrap_or_else(|_| "<unable to compute folder hash>".to_string());

            mods_list.push(ModInfo {
                mod_name,
                modinfo_path: modinfo_path_str.to_string(),
                modinfo_id: modinfo_xml.as_ref().and_then(|xml| xml.id.clone()),
                civmods_internal_version_id: modinfo_xml
                    .as_ref()
                    .and_then(|xml| xml.properties.civ_mods_internal_version_id.clone()),
                folder_hash,
                // Only the folder name without the full path
                // Should be the same as mod_name for now
                folder_name: mod_dir.file_name().unwrap().to_string_lossy().to_string(),
            });
        }
    }

    Ok(mods_list)
}

#[tauri::command]
pub fn get_unlocked_mod_folders(
    mods_folder_path: Option<String>,
    excluded_modinfo_ids: Vec<String>,
) -> Result<Vec<String>, String> {
    // Scan all mods in the given folder
    let all_mods = scan_civ_mods(mods_folder_path.clone())?;

    // Filter only mods that are NOT in the excluded list
    let unlocked_mods: Vec<String> = all_mods
        .into_iter()
        .filter(|mod_info| {
            // Only include mods that have a valid modinfo_id and are NOT in the exclude list
            match &mod_info.modinfo_id {
                Some(id) if excluded_modinfo_ids.contains(id) => false, // Exclude mod
                _ => true,                                              // Include mod
            }
        })
        .map(|mod_info| mod_info.folder_name) // Extract folder names
        .collect();

    Ok(unlocked_mods)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_xml() {
        let xml = r#"<Item>ui/shell/extras/screen-extras.js</item>"#;
        let mut output = vec![];
        sanitize_xml(xml.as_bytes(), &mut output).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&output),
            r#"<Item>ui/shell/extras/screen-extras.js</Item>"#,
        );
    }

    #[test]
    fn test_parse_mod_xml() {
        // NOTE: This is not a valid ModInfo XML
        let xml = r#"<Mod id="a_mod"><Item>ui/shell/extras/screen-extras.js</item></Mod>"#;

        let mut buffer = vec![];
        sanitize_xml(xml.as_bytes(), &mut buffer).unwrap();
        let sanitized = String::from_utf8_lossy(&buffer).to_string();

        let mod_xml: ModXml = quick_xml::de::from_str(&sanitized).unwrap();
        assert_eq!(mod_xml.id, Some("a_mod".to_string()));
    }

    #[test]
    fn test_parse_ampersand_in_text() {
        let xml =
            r#"<Mod id="a_mod"><Properties><Name>Mod by me & friends</Name></Properties></Mod>"#;
        let mut buffer = vec![];
        sanitize_xml(xml.as_bytes(), &mut buffer).unwrap();
        let sanitized = String::from_utf8_lossy(&buffer).to_string();

        assert_eq!(
            sanitized,
            r#"<Mod id="a_mod"><Properties><Name>Mod by me &amp; friends</Name></Properties></Mod>"#,
        );
    }
}
