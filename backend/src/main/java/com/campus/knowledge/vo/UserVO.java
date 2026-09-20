package com.campus.knowledge.vo;

import com.campus.knowledge.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户信息返回对象（不包含密码）
 */
@Data
public class UserVO {

    /** 用户ID */
    private Long id;

    /** 学号/工号 */
    private String username;

    /** 真实姓名 */
    private String realName;

    /** 角色：0=学生，1=管理员，2=信任账号 */
    private Integer role;

    /** 邮箱 */
    private String email;

    /** 状态：0=正常，1=禁用 */
    private Integer status;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /**
     * 由实体转换（隐藏密码字段）
     */
    public static UserVO from(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setRole(user.getRole());
        vo.setEmail(user.getEmail());
        vo.setStatus(user.getStatus());
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }
}