package com.campus.knowledge.vo;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 登录返回结果
 */
@Data
@AllArgsConstructor
public class LoginVO {

    /** JWT 令牌 */
    private String token;

    /** 用户信息 */
    private UserVO user;
}