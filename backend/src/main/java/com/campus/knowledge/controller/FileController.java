package com.campus.knowledge.controller;

import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.common.Result;
import com.campus.knowledge.vo.FileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

/**
 * 文件上传/访问接口
 * 上传走 /api/files（需登录），访问走 /files（公开，供 <img>/下载，不经过鉴权拦截器）
 */
@RestController
@RequiredArgsConstructor
public class FileController {

    @Value("${campus.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/api/files")
    public Result<FileVO> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            ext = original.substring(dot);
        }
        String stored = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = dir.resolve(stored);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return Result.ok(new FileVO("/files/" + stored, original, file.getContentType(), file.getSize()));
    }

    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> download(@PathVariable String fileName) throws IOException {
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path target = root.resolve(fileName).normalize();
        if (!target.startsWith(root)) {
            return ResponseEntity.badRequest().build();
        }
        Resource resource = new FileSystemResource(target);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = contentTypeOf(target);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + target.getFileName() + "\"")
                .body(resource);
    }

    /** 按扩展名推断 MIME，图片/PDF 可内联预览 */
    private String contentTypeOf(Path p) {
        String name = p.getFileName() == null ? "" : p.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }
}