use diffy::create_patch;
use diffy::Patch;
use quick_xml::errors::IllFormedError;
use quick_xml::events::{BytesEnd, BytesStart, BytesText, Event};
use quick_xml::Error;
use quick_xml::Reader;
use quick_xml::Writer;
use serde::Deserialize;
use std::collections::BTreeMap;
use std::fs;
use std::io::Cursor;
use std::path::Path;
use tauri::AppHandle;

#[derive(Debug, Deserialize)]
pub struct CivModsProperties {
    pub target_modinfo_id: Option<String>,
    pub target_modinfo_path: Option<String>,
    pub internal_version_id: String,
    pub mod_url: String,
    pub mod_version: Option<String>,
    pub mod_category: Option<String>,
    pub mod_version_date: Option<String>,
}

/// Constant defining the patch XML file name.
const PATCH_XML_FILE_NAME: &str = ".civmods-modinfo.diff";

/// Tauri command to patch a modinfo XML with CivMods properties and generate a diff.
#[tauri::command]
pub async fn patch_modinfo_xml_command(
    _app: AppHandle,
    modinfo_path: String,
    civ_properties: CivModsProperties,
) -> Result<(), String> {
    patch_modinfo_xml(modinfo_path, civ_properties)
}

fn map_props_to_xml(props: &CivModsProperties) -> BTreeMap<String, String> {
    let mut props_map = BTreeMap::new();
    props_map.insert("CivModsURL".to_string(), props.mod_url.clone());
    if let Some(version) = &props.mod_version {
        props_map.insert("CivModsVersion".to_string(), version.clone());
    }
    if let Some(category) = &props.mod_category {
        props_map.insert("CivModsCategory".to_string(), category.clone());
    }
    if let Some(version_date) = &props.mod_version_date {
        props_map.insert("CivModsVersionDate".to_string(), version_date.clone());
    }
    props_map.insert(
        "CivModsInternalVersionId".to_string(),
        props.internal_version_id.clone(),
    );
    props_map
}

/// Applies a patch to the <Properties> section of a modinfo XML file.
/// Adds CivMods custom metadata and generates a ._modinfo_civmods_patch diff file.
pub fn patch_modinfo_xml<P: AsRef<Path>>(
    modinfo_path: P,
    properties: CivModsProperties,
) -> Result<(), String> {
    let original = fs::read_to_string(&modinfo_path)
        .map_err(|e| format!("Failed to read modinfo file: {e}"))?;

    let mut reader = Reader::from_str(&original);
    let mut writer = Writer::new(Cursor::new(Vec::new()));
    let mut buf = Vec::new();

    let props_map = map_props_to_xml(&properties);

    // Helpers for navigating XML
    let mut in_properties = false;
    let mut inserted = false;
    let mut indent_prefix: Option<String> = None;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) if e.name().as_ref().eq_ignore_ascii_case(b"Properties") => {
                in_properties = true;
                writer.write_event(Event::Start(e.to_owned())).unwrap();
            }
            Ok(Event::Text(e)) if in_properties => {
                let text = e.unescape().unwrap_or_default();
                if text.trim().is_empty() {
                    // Get only the indentation (last line's spaces/tabs)
                    let indent_only = text.lines().last().unwrap_or_default();
                    indent_prefix = Some(indent_only.to_string());
                }
                writer.write_event(Event::Text(e)).unwrap();
            }
            Ok(Event::End(ref e))
                if in_properties && e.name().as_ref().eq_ignore_ascii_case(b"Properties") =>
            {
                if !inserted {
                    log::info!("patch/hash: Inserting custom properties into modinfo file, indent is '{:?}'", indent_prefix);
                    insert_custom_properties(
                        &mut writer,
                        &props_map,
                        indent_prefix.as_deref().unwrap_or("    "),
                    )?;

                    inserted = true;
                }
                writer.write_event(Event::End(e.to_owned())).unwrap();
                in_properties = false;
            }
            Ok(Event::Eof) => break,
            Ok(e) => {
                writer.write_event(e).unwrap();
            }
            Err(Error::IllFormed(IllFormedError::MismatchedEndTag { expected, found })) => {
                log::warn!("Mismatched end tag: expected: {expected:?}, found: {found:?}");
                writer
                    .write_event(Event::End(BytesEnd::new(expected)))
                    .unwrap();
            }
            Err(Error::IllFormed(IllFormedError::MissingEndTag(tag))) => {
                log::warn!("Missing end tag: {tag:?}");
                writer.write_event(Event::End(BytesEnd::new(tag))).unwrap();
            }
            Err(Error::IllFormed(IllFormedError::UnmatchedEndTag(tag))) => {
                log::warn!("Unmatched end tag: {tag:?}");
                writer.write_event(Event::End(BytesEnd::new(tag))).unwrap();
            }
            Err(e) => return Err(format!("Error parsing XML: {e}")),
        }
        buf.clear();
    }

    let modified_bytes = writer.into_inner().into_inner();
    let modified = String::from_utf8(modified_bytes).map_err(|e| format!("UTF-8 error: {e}"))?;

    // Generate and save diff
    let patch = create_patch(&modified, &original);
    let patch_path = modinfo_path.as_ref().with_file_name(PATCH_XML_FILE_NAME);

    fs::write(patch_path, patch.to_string())
        .map_err(|e| format!("Failed to write patch file: {e}"))?;

    // Apply patch
    fs::write(&modinfo_path, modified).map_err(|e| format!("Failed to write modinfo file: {e}"))?;

    Ok(())
}

/// Writes a set of tag-value pairs as XML elements under <Properties>
fn insert_custom_properties<W: std::io::Write>(
    writer: &mut Writer<W>,
    props: &BTreeMap<String, String>,
    indent: &str,
) -> Result<(), String> {
    writer
        .write_event(Event::Comment(BytesText::new(
            " Added automatically by CivMods: Do not edit ",
        )))
        .unwrap();
    // Write comment before inserted properties
    writer
        .write_event(Event::Text(BytesText::new(&format!("\n{}", indent))))
        .unwrap();

    for (key, value) in props {
        let element = BytesStart::new(key.as_str());
        writer.write_event(Event::Start(element)).unwrap();
        writer
            .write_event(Event::Text(BytesText::new(value)))
            .unwrap();
        writer
            .write_event(Event::End(BytesEnd::new(key.as_str())))
            .unwrap();

        writer
            .write_event(Event::Text(BytesText::new(&format!("\n{}", indent))))
            .unwrap();
    }

    Ok(())
}

/// Restores a patched modinfo file (if a patch file exists) to its original content in memory.
pub fn restore_patched_modinfo_xml(modinfo_path: &Path) -> Result<Option<Vec<u8>>, String> {
    let patch_path = modinfo_path.with_file_name(PATCH_XML_FILE_NAME);

    if !patch_path.exists() {
        return Ok(None); // No patch found
    }

    let original = fs::read_to_string(modinfo_path)
        .map_err(|e| format!("Failed to read modinfo file: {e}"))?;
    let patch_str =
        fs::read_to_string(patch_path).map_err(|e| format!("Failed to read patch file: {e}"))?;

    let patch = Patch::from_str(&patch_str).map_err(|e| format!("Failed to parse patch: {e}"))?;

    log::info!("patch/hash: Restoring modinfo file: {:?}", modinfo_path);
    let restored =
        diffy::apply(&original, &patch).map_err(|e| format!("Failed to apply patch: {e}"))?;

    Ok(Some(restored.into_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_patch_and_restore_modinfo_xml() {
        let dir = tempdir().unwrap();
        let modinfo_path = dir.path().join("TestMod.modinfo");
        let patch_path = dir.path().join(PATCH_XML_FILE_NAME);

        let original = r#"<Mod><Properties><Name>Original</Name></Properties></Mod>"#;

        // Write the original modinfo file
        fs::write(&modinfo_path, original).expect("Failed to write original modinfo");

        // Create a patch
        patch_modinfo_xml(
            &modinfo_path,
            CivModsProperties {
                target_modinfo_id: None,
                target_modinfo_path: None,
                internal_version_id: "abc".to_string(),
                mod_url: "https://test.com".to_string(),
                mod_version: Some("1.0".to_string()),
                mod_category: Some("Test".to_string()),
                mod_version_date: Some("2023-10-01T10:00:00".to_string()),
            },
        )
        .expect("Failed to patch");

        // Check if the patch file was created
        assert!(patch_path.exists());
        // Check if the modinfo file was modified
        assert!(fs::read_to_string(&modinfo_path)
            .expect("Failed to read")
            .contains("CivModsVersion"));

        // Apply restore logic
        let restored = restore_patched_modinfo_xml(&modinfo_path).expect("Failed to restore");

        assert_eq!(restored, Some(original.as_bytes().to_vec()));
    }
}
