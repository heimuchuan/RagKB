package com.campus.knowledge.service;

import com.campus.knowledge.dto.LoginRequest;
import com.campus.knowledge.dto.RegisterRequest;
import com.campus.knowledge.vo.LoginVO;
import com.campus.knowledge.vo.UserVO;

/**
 * 认证服务
 */
public interface AuthService {

    /**
     * 登录：校验密码并签发 JWT
     */
    LoginVO login(LoginRequest request);

    /**
     * 注册学生账号
     */
    void register(RegisterRequest request);

    /**
     * 获取当前登录用户信息
     */
    UserVO me();

    /**
     * 修改密码
     */
    void changePassword(Long userId, String oldPassword, String newPassword);
}