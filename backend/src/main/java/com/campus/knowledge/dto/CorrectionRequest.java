package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 纠错反馈请求
 */
@Data
public class CorrectionRequest {

    /** 关联的知识条目ID */
    @NotNull(message = "条目ID不能为空")
    private Long entryId;

    /** 原文内容 */
    private String originalContent;

    /** 建议修正内容 */
    private String suggestedContent;

    /** 纠错原因 */
    private String reason;
}