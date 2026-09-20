package com.campus.knowledge.controller;

import com.campus.knowledge.common.Result;
import com.campus.knowledge.dto.LoginRequest;
import com.campus.knowledge.dto.PasswordUpdateRequest;
import com.campus.knowledge.dto.RegisterRequest;
import com.campus.knowledge.security.UserContext;
import com.campus.knowledge.service.AuthService;
import com.campus.knowledge.vo.LoginVO;
import com.campus.knowledge.vo.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证接口
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 登录
     */
    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginRequest request) {
        return Result.ok(authService.login(request));
    }

    /**
     * 注册
     */
    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return Result.ok();
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public Result<UserVO> me() {
        return Result.ok(authService.me());
    }

    /**
     * 修改密码
     */
    @PutMapping("/password")
    public Result<Void> password(@Valid @RequestBody PasswordUpdateRequest request) {
        authService.changePassword(UserContext.getUserId(), request.getOldPassword(), request.getNewPassword());
        return Result.ok();
    }
}