use flate2::read::GzDecoder;
use sevenz_rust::decompress_file;
use std::fs::{self, File};
use std::io::{self, BufReader};
use std::path::Path;
use unrar::Archive;
use zip::ZipArchive;

use super::traversal::find_modinfo_file;

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

fn extract_tgz(archive_path: &str, extract_to: &str) -> io::Result<()> {
    // Open the tar.gz file
    let file = File::open(archive_path)?;

    // Wrap it in a buffered reader for efficiency
    let buf_reader = BufReader::new(file);

    // Create a GzDecoder to decompress the gzip layer
    let gz_decoder = GzDecoder::new(buf_reader);

    // Create a tar Archive from the decompressed stream
    let mut archive = tar::Archive::new(gz_decoder);

    // Extract the archive to the output directory
    archive.unpack(extract_to)?;

    println!("Extracted '{}' to '{}'", archive_path, extract_to);
    Ok(())
}

/// Extracts any archive format based on file extension
pub fn extract_archive(archive_path: &str, extract_to: &str) -> Result<(), String> {
    let ext = Path::new(archive_path)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

    // e.g. /path/to/extract_to__temp
    let temp_target = format!("{}__temp", extract_to);

    let result = match ext.as_str() {
        "zip" => extract_zip(archive_path, &temp_target).map_err(|e| e.to_string()),
        "7z" => extract_7z(archive_path, &temp_target).map_err(|e| e.to_string()),
        "rar" => extract_rar(archive_path, &temp_target).map_err(|e| e.to_string()),
        // We should support `.tar.gz` but the extension algorithm doesn't support it right now
        "tgz" | "gz" => extract_tgz(archive_path, &temp_target).map_err(|e| e.to_string()),
        _ => Err(format!("Unsupported file format: {}", ext)),
    };

    if let Err(e) = result {
        return Err(format!("Failed to extract archive: {}", e));
    }

    let (modinfo_path, _) = find_modinfo_file(Path::new(&temp_target));
    let modinfo_dir = Path::new(modinfo_path.as_deref().unwrap())
        .parent()
        .ok_or("Modinfo file not found")?;

    println!("Modinfo directory: {:?}", modinfo_dir);

    recursively_grant_write_permissions(modinfo_dir)
        .map_err(|e| format!("Failed to grant write permissions: {}", e))?;

    // Copy the modinfo_dir directory to the target directory
    let _ = fs::create_dir_all(extract_to);

    let mut copy_options = fs_extra::dir::CopyOptions::new();
    copy_options.overwrite = true;
    copy_options.content_only = true;

    fs_extra::dir::copy(modinfo_dir, extract_to, &copy_options)
        .map_err(|e| format!("Failed to copy modinfo directory: {}", e))?;

    // Remove the temp directory
    fs::remove_dir_all(&temp_target)
        .map_err(|e| format!("Failed to remove temp directory: {}", e))?;

    Ok(())
}

fn recursively_grant_write_permissions(root: &Path) -> io::Result<()> {
    let mut files = vec![root.to_path_buf()];
    while let Some(file) = files.pop() {
        let mut permissions = fs::metadata(&file)?.permissions();
        permissions.set_readonly(false);
        fs::set_permissions(&file, permissions)?;
        if file.is_dir() {
            for entry in fs::read_dir(file)? {
                files.push(entry?.path());
            }
        }
    }
    Ok(())
}
