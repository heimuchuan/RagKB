package com.campus.knowledge.dto;

import lombok.Data;

/**
 * 知识条目附件（上传后回传的元数据）
 */
@Data
public class AttachmentDTO {

    /** 访问地址 */
    private String url;

    /** 原始文件名 */
    private String name;

    /** 文件类型（MIME） */
    private String type;

    /** 文件大小（字节） */
    private long size;
}