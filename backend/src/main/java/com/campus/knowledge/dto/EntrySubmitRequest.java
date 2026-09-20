package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 知识条目提交/编辑请求
 */
@Data
public class EntrySubmitRequest {

    /** 标题 */
    @NotBlank(message = "标题不能为空")
    private String title;

    /** 所属分类ID */
    private Long categoryId;

    /** 正文内容 */
    @NotBlank(message = "内容不能为空")
    private String content;
}