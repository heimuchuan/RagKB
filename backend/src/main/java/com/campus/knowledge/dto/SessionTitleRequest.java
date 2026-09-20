package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 会话标题编辑请求（手动重命名会话）
 */
@Data
public class SessionTitleRequest {

    /** 新标题 */
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题长度不能超过100")
    private String title;
}