package com.dairy.management.service;

import com.dairy.management.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

/**
 * Owns all managed-file operations for product/category images. Knows nothing
 * about product or category business rules — callers decide which entity
 * receives the returned public URL.
 *
 * Security model (defence in depth; a single spoofed signal is not enough):
 *   1. non-empty and within the size limit
 *   2. extension is on the allowlist
 *   3. declared MIME type is an allowed image type
 *   4. magic bytes prove the real content type
 *   5. extension and magic bytes must agree (rejects renamed/mismatched files)
 *   6. the stored filename is server-generated (UUID) — the client filename is
 *      never used as a path, so traversal via the original name is impossible;
 *      the resolved destination is still re-checked to be under the upload root.
 */
@Service
@Slf4j
public class FileStorageService {

    /** Recognised image kinds, each with its canonical extension + accepted extensions. */
    private enum ImageType {
        JPEG("jpg", "image/jpeg"),
        PNG("png", "image/png"),
        WEBP("webp", "image/webp");

        final String canonicalExt;
        final String mime;
        ImageType(String canonicalExt, String mime) { this.canonicalExt = canonicalExt; this.mime = mime; }
    }

    private static final long MAX_BYTES = 5L * 1024 * 1024; // 5 MB, matches spring.servlet.multipart

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    /**
     * Validate and store an uploaded image under {uploadDir}/{subdir}. Returns
     * the public URL ("/uploads/{subdir}/{uuid}.{ext}"). Throws ApiException
     * (400) for any invalid file; on that path nothing is written, so an
     * existing image the caller holds is untouched.
     */
    public String store(MultipartFile file, String subdir, String filenamePrefix) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("No image file was provided", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException("Image exceeds the 5 MB limit", HttpStatus.BAD_REQUEST);
        }

        String ext = extensionOf(file.getOriginalFilename());
        ImageType byExt = imageTypeForExtension(ext);
        if (byExt == null) {
            throw new ApiException("Unsupported image type — use JPG, PNG or WebP", HttpStatus.BAD_REQUEST);
        }

        String declared = file.getContentType();
        if (declared != null && !declared.isBlank() && !isAllowedMime(declared)) {
            throw new ApiException("Unsupported image type — use JPG, PNG or WebP", HttpStatus.BAD_REQUEST);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ApiException("Could not read the uploaded file", HttpStatus.BAD_REQUEST);
        }

        ImageType byContent = detectSignature(bytes);
        if (byContent == null) {
            throw new ApiException("File is not a valid JPG, PNG or WebP image", HttpStatus.BAD_REQUEST);
        }
        if (byContent != byExt) {
            throw new ApiException("Image content does not match its file extension", HttpStatus.BAD_REQUEST);
        }

        String filename = filenamePrefix + "_" + UUID.randomUUID().toString().substring(0, 8)
                + "." + byContent.canonicalExt;

        Path root = uploadRoot(subdir);
        Path dest = root.resolve(filename).normalize();
        if (!dest.startsWith(root)) {
            // Cannot happen with a UUID filename, but fail closed regardless.
            throw new ApiException("Invalid storage path", HttpStatus.BAD_REQUEST);
        }

        try {
            Files.createDirectories(root);
            Files.write(dest, bytes);
        } catch (IOException e) {
            log.error("Failed to store image under {}", subdir, e);
            throw new ApiException("Could not save the image, please try again", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return "/uploads/" + subdir + "/" + filename;
    }

    /**
     * Delete a previously managed image, identified by the public URL we issued.
     * Ignores null, external URLs, and anything that resolves outside the upload
     * root. Never throws — a failed cleanup must not fail the caller's operation.
     */
    public void deleteManaged(String publicUrl, String subdir) {
        if (publicUrl == null || publicUrl.isBlank()) return;

        String expectedPrefix = "/uploads/" + subdir + "/";
        if (!publicUrl.startsWith(expectedPrefix)) {
            // External URL or a different managed area — not ours to delete.
            log.debug("Skipping delete of non-managed image url");
            return;
        }

        Path root = uploadRoot(subdir);
        String filename = Paths.get(publicUrl).getFileName().toString();
        Path target = root.resolve(filename).normalize();
        if (!target.startsWith(root)) {
            log.warn("Refusing to delete a path outside the upload root");
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Failed to delete old managed image (leaving it in place): {}", e.getMessage());
        }
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    private Path uploadRoot(String subdir) {
        return Paths.get(uploadDir, subdir).toAbsolutePath().normalize();
    }

    private static String extensionOf(String originalName) {
        if (originalName == null) return "";
        int dot = originalName.lastIndexOf('.');
        if (dot < 0 || dot == originalName.length() - 1) return "";
        return originalName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static ImageType imageTypeForExtension(String ext) {
        return switch (ext) {
            case "jpg", "jpeg" -> ImageType.JPEG;
            case "png"         -> ImageType.PNG;
            case "webp"        -> ImageType.WEBP;
            default            -> null;
        };
    }

    private static boolean isAllowedMime(String mime) {
        String m = mime.toLowerCase(Locale.ROOT);
        return m.equals(ImageType.JPEG.mime)
                || m.equals(ImageType.PNG.mime)
                || m.equals(ImageType.WEBP.mime)
                || m.equals("image/jpg"); // some clients send this non-standard value
    }

    /** Identify the true image type from leading magic bytes, or null. */
    private static ImageType detectSignature(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return ImageType.JPEG;
        }
        if (b.length >= 8
                && (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return ImageType.PNG;
        }
        // WebP: "RIFF" .... "WEBP"
        if (b.length >= 12
                && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return ImageType.WEBP;
        }
        return null;
    }
}
