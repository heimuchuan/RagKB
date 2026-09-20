package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 处理纠错请求
 */
@Data
public class CorrectionHandleRequest {

    /** 处理结果：1=采纳，2=拒绝 */
    @NotNull(message = "处理结果不能为空")
    private Integer status;

    /** 管理员回复 */
    private String reply;
}