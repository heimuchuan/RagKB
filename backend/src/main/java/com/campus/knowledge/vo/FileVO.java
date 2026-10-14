package com.campus.knowledge.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传返回结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileVO {

    /** 访问地址（相对路径，供前端 <img>/下载使用） */
    private String url;

    /** 原始文件名 */
    private String name;

    /** 文件类型（MIME） */
    private String type;

    /** 文件大小（字节） */
    private long size;
}