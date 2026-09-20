package com.campus.knowledge.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 批量审核请求
 */
@Data
public class BatchApproveRequest {

    /** 待审核通过的条目ID列表 */
    @NotEmpty(message = "条目ID列表不能为空")
    private List<Long> ids;
}