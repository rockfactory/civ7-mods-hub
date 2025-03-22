use quick_xml::errors::{Error, IllFormedError};
use quick_xml::events::{BytesEnd, Event};
use quick_xml::{Reader, Writer};
use std::fs::File;
use std::io::{BufReader, Read, Write};
use std::path::Path;

pub mod schema;
pub use schema::Mod;

impl Mod {
    pub fn open(modinfo_path: impl AsRef<Path>) -> anyhow::Result<Self> {
        Ok(Mod::parse(File::open(modinfo_path)?)?)
    }

    pub fn parse(source: impl Read) -> Result<Self, quick_xml::DeError> {
        let mut buffer = vec![];
        Self::sanitize(source, &mut buffer)?;
        let sanitized = String::from_utf8_lossy(&buffer).to_string();
        quick_xml::de::from_str(&sanitized)
    }

    fn sanitize(reader: impl Read, writer: impl Write) -> quick_xml::Result<()> {
        let mut reader = Reader::from_reader(BufReader::new(reader));
        let mut writer = Writer::new(writer);

        let mut buffer = Vec::new();
        loop {
            let event = match reader.read_event_into(&mut buffer) {
                Ok(Event::Eof) => return Ok(()),
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_xml() {
        let xml = r#"<Item>ui/shell/extras/screen-extras.js</item>"#;
        let mut output = vec![];
        Mod::sanitize(xml.as_bytes(), &mut output).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&output),
            r#"<Item>ui/shell/extras/screen-extras.js</Item>"#,
        );
    }

    #[test]
    fn test_parse_mod_xml() {
        // NOTE: This is not a valid ModInfo XML
        let xml = r#"<Mod id="a_mod"><Item>ui/shell/extras/screen-extras.js</item></Mod>"#;
        let mod_xml = Mod::parse(xml.as_bytes()).unwrap();
        assert_eq!(mod_xml.id, Some("a_mod".to_string()));
    }
}
