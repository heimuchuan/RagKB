package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 智能问答请求
 */
@Data
public class AskRequest {

    /** 问题 */
    @NotBlank(message = "问题不能为空")
    private String question;

    /** 会话ID（多轮对话；为空则新建会话） */
    private String sessionId;
}