package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 审核驳回请求
 */
@Data
public class RejectRequest {

    /** 驳回原因 */
    @NotBlank(message = "驳回原因不能为空")
    private String reason;
}