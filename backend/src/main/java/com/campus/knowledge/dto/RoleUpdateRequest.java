package com.campus.knowledge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 设置用户角色请求
 */
@Data
public class RoleUpdateRequest {

    /** 角色：0=学生，1=管理员，2=信任账号 */
    @NotNull(message = "角色不能为空")
    @Min(value = 0, message = "角色值非法")
    @Max(value = 2, message = "角色值非法")
    private Integer role;
}