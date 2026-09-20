package com.campus.knowledge.service.impl;

import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.dto.LoginRequest;
import com.campus.knowledge.dto.RegisterRequest;
import com.campus.knowledge.entity.User;
import com.campus.knowledge.security.JwtUtil;
import com.campus.knowledge.security.UserContext;
import com.campus.knowledge.service.AuthService;
import com.campus.knowledge.service.UserService;
import com.campus.knowledge.vo.LoginVO;
import com.campus.knowledge.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public LoginVO login(LoginRequest request) {
        User user = userService.getByUsername(request.getUsername());
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 1) {
            throw new BusinessException(403, "账号已被禁用");
        }
        int role = user.getRole() == null ? 0 : user.getRole();
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), role);
        return new LoginVO(token, UserVO.from(user));
    }

    @Override
    public void register(RegisterRequest request) {
        if (userService.getByUsername(request.getUsername()) != null) {
            throw new BusinessException("用户名已存在");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRealName(request.getRealName());
        user.setEmail(request.getEmail());
        user.setRole(0);
        user.setStatus(0);
        userService.save(user);
    }

    @Override
    public UserVO me() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException(401, "未登录或登录已过期");
        }
        User user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }
        return UserVO.from(user);
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException("原密码错误");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userService.updateById(user);
    }
}