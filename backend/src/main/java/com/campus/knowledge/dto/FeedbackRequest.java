package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 点赞/点踩反馈请求
 * 适用于知识条目与问答记录
 */
@Data
public class FeedbackRequest {

    /** 反馈类型：1=点赞，2=点踩 */
    @NotNull(message = "反馈类型不能为空")
    private Integer type;

    /** 点踩时填写的原因（可选） */
    private String reason;
}