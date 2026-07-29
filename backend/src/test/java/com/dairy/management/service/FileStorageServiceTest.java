package com.dairy.management.service;

import com.dairy.management.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("FileStorageService — upload security")
class FileStorageServiceTest {

    @TempDir Path tempDir;
    private FileStorageService storage;

    @BeforeEach
    void setUp() {
        storage = new FileStorageService();
        ReflectionTestUtils.setField(storage, "uploadDir", tempDir.toString());
    }

    /* ── valid magic-byte payloads ───────────────────────────────────────── */
    private static byte[] jpeg() {
        byte[] b = new byte[32];
        b[0] = (byte) 0xFF; b[1] = (byte) 0xD8; b[2] = (byte) 0xFF; b[3] = (byte) 0xE0;
        return b;
    }
    private static byte[] png() {
        byte[] b = new byte[32];
        b[0] = (byte) 0x89; b[1] = 'P'; b[2] = 'N'; b[3] = 'G';
        b[4] = 0x0D; b[5] = 0x0A; b[6] = 0x1A; b[7] = 0x0A;
        return b;
    }
    private static byte[] webp() {
        byte[] b = new byte[32];
        b[0]='R'; b[1]='I'; b[2]='F'; b[3]='F';
        b[8]='W'; b[9]='E'; b[10]='B'; b[11]='P';
        return b;
    }

    private MockMultipartFile file(String name, String ct, byte[] bytes) {
        return new MockMultipartFile("file", name, ct, bytes);
    }

    /* ── accepted ────────────────────────────────────────────────────────── */

    @Test @DisplayName("valid JPEG/PNG/WebP are accepted and stored with a server-generated name")
    void acceptsValidImages() throws IOException {
        String jpgUrl  = storage.store(file("photo.jpg",  "image/jpeg", jpeg()), "products", "product_1");
        String pngUrl  = storage.store(file("photo.png",  "image/png",  png()),  "products", "product_1");
        String webpUrl = storage.store(file("photo.webp", "image/webp", webp()), "products", "product_1");

        assertThat(jpgUrl).matches("/uploads/products/product_1_[0-9a-f]{8}\\.jpg");
        assertThat(pngUrl).endsWith(".png");
        assertThat(webpUrl).endsWith(".webp");
        // original client filename is never used as the stored name
        assertThat(jpgUrl).doesNotContain("photo");
        assertThat(Files.exists(tempDir.resolve("products").resolve(jpgUrl.substring(jpgUrl.lastIndexOf('/') + 1)))).isTrue();
    }

    @Test @DisplayName("jpeg extension accepted for .jpeg too")
    void acceptsJpegExtension() {
        assertThat(storage.store(file("p.jpeg", "image/jpeg", jpeg()), "products", "product_1")).endsWith(".jpg");
    }

    /* ── rejected: the attack matrix ─────────────────────────────────────── */

    private void assertBadRequest(MockMultipartFile f) {
        assertThatThrownBy(() -> storage.store(f, "products", "product_1"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test @DisplayName("empty file rejected")
    void rejectsEmpty() { assertBadRequest(file("photo.jpg", "image/jpeg", new byte[0])); }

    @Test @DisplayName("oversized file rejected")
    void rejectsOversized() {
        byte[] big = new byte[6 * 1024 * 1024];
        big[0] = (byte) 0xFF; big[1] = (byte) 0xD8; big[2] = (byte) 0xFF;
        assertBadRequest(file("photo.jpg", "image/jpeg", big));
    }

    @Test @DisplayName("SVG rejected (extension not allowed)")
    void rejectsSvg() { assertBadRequest(file("logo.svg", "image/svg+xml", "<svg/>".getBytes(StandardCharsets.UTF_8))); }

    @Test @DisplayName("HTML rejected")
    void rejectsHtml() { assertBadRequest(file("x.html", "text/html", "<html></html>".getBytes(StandardCharsets.UTF_8))); }

    @Test @DisplayName("JSP/script rejected")
    void rejectsJsp() { assertBadRequest(file("shell.jsp", "application/octet-stream", "<% %>".getBytes(StandardCharsets.UTF_8))); }

    @Test @DisplayName("fake .jpg containing text rejected (magic bytes fail)")
    void rejectsFakeJpg() { assertBadRequest(file("photo.jpg", "image/jpeg", "just text".getBytes(StandardCharsets.UTF_8))); }

    @Test @DisplayName("PNG bytes with .jpg extension rejected (content/extension mismatch)")
    void rejectsMismatch() { assertBadRequest(file("photo.jpg", "image/jpeg", png())); }

    @Test @DisplayName("declared non-image MIME rejected")
    void rejectsBadMime() { assertBadRequest(file("photo.jpg", "text/html", jpeg())); }

    @Test @DisplayName("double-extension attack (photo.jpg.html) rejected")
    void rejectsDoubleExtension() { assertBadRequest(file("photo.jpg.html", "text/html", jpeg())); }

    @Test @DisplayName("JPEG bytes uploaded as .html rejected")
    void rejectsJpegAsHtml() { assertBadRequest(file("evil.html", "image/jpeg", jpeg())); }

    /* ── traversal safety on the stored path ─────────────────────────────── */

    @Test @DisplayName("traversal in original filename cannot escape upload root")
    void traversalOriginalNameContained() throws IOException {
        // server generates the name, so this stores safely inside products/
        String url = storage.store(file("../../../../etc/passwd.jpg", "image/jpeg", jpeg()), "products", "product_1");
        assertThat(url).startsWith("/uploads/products/");
        assertThat(url).doesNotContain("..");
        // nothing was written outside the temp upload dir
        assertThat(Files.walk(tempDir).filter(Files::isRegularFile).count()).isEqualTo(1);
    }

    /* ── deleteManaged safety ────────────────────────────────────────────── */

    @Test @DisplayName("deleteManaged removes a managed file")
    void deletesManaged() {
        String url = storage.store(file("p.jpg", "image/jpeg", jpeg()), "products", "product_1");
        Path onDisk = tempDir.resolve("products").resolve(url.substring(url.lastIndexOf('/') + 1));
        assertThat(onDisk).exists();
        storage.deleteManaged(url, "products");
        assertThat(onDisk).doesNotExist();
    }

    @Test @DisplayName("deleteManaged ignores external URLs")
    void ignoresExternalUrl() {
        // must not throw, must not touch anything
        storage.deleteManaged("https://evil.example.com/x.jpg", "products");
        storage.deleteManaged("/etc/passwd", "products");
    }

    @Test @DisplayName("deleteManaged refuses a traversal path outside the root")
    void refusesTraversalDelete() throws IOException {
        Path outside = tempDir.resolve("secret.txt");
        Files.writeString(outside, "keep me");
        storage.deleteManaged("/uploads/products/../../secret.txt", "products");
        assertThat(outside).exists(); // untouched
    }
}
