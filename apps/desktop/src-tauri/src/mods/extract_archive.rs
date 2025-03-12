use core::arch;
use sevenz_rust::decompress_file;
use std::fs::{self, File};
use std::io::{self, BufReader, Write};
use std::path::{Path, PathBuf};
use unrar::Archive;
use zip::ZipArchive;

/// Extract ZIP files using `zip 2.x`
fn extract_zip(archive_path: &str, extract_to: &str) -> io::Result<()> {
    let file = File::open(archive_path)?;
    let mut archive = ZipArchive::new(BufReader::new(file))?;

    fs::create_dir_all(extract_to)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let out_path = Path::new(extract_to).join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&out_path)?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut outfile = File::create(&out_path)?;
            io::copy(&mut file, &mut outfile)?;
        }
    }

    Ok(())
}

/// Extract 7z files using `sevenz-rust`
fn extract_7z(archive_path: &str, extract_to: &str) -> io::Result<()> {
    fs::create_dir_all(extract_to)?;
    decompress_file(archive_path, extract_to)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    Ok(())
}

/// Extract RAR files using `unrar 0.5.8`
fn extract_rar(archive_path: &str, extract_to: &str) -> io::Result<()> {
    let mut archive = Archive::new(archive_path).open_for_processing().unwrap();

    while let Some(header) = archive
        .read_header()
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?
    {
        println!(
            "{} bytes: {}",
            header.entry().unpacked_size,
            header.entry().filename.to_string_lossy(),
        );
        archive = if header.entry().is_file() {
            header
                .extract_with_base(extract_to)
                .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?
        } else {
            header
                .skip()
                .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?
        };
    }
    Ok(())
}

/// Extracts any archive format based on file extension
pub fn extract_archive(archive_path: &str, extract_to: &str) -> Result<(), String> {
    let ext = Path::new(archive_path)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "zip" => extract_zip(archive_path, extract_to).map_err(|e| e.to_string()),
        "7z" => extract_7z(archive_path, extract_to).map_err(|e| e.to_string()),
        "rar" => extract_rar(archive_path, extract_to).map_err(|e| e.to_string()),
        _ => Err(format!("Unsupported file format: {}", ext)),
    }
}

/// Main function for testing
fn main() {
    let archive_path = "example.rar"; // Change to .7z or .zip for testing
    let extract_path = "extracted";

    match extract_archive(archive_path, extract_path) {
        Ok(_) => println!("Extraction successful!"),
        Err(e) => eprintln!("Error extracting archive: {}", e),
    }
}
