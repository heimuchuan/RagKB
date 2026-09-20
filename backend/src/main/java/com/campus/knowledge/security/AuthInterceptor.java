package com.campus.knowledge.security;

import com.campus.knowledge.common.Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 鉴权拦截器
 * 从 Authorization: Bearer <token> 解析用户信息并写入 UserContext；
 * 对 /api/admin/** 路径校验管理员权限。
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 放行 CORS 预检请求
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return writeError(response, 401, "未登录或登录已过期");
        }

        String token = auth.substring(7).trim();
        try {
            Claims claims = jwtUtil.parseToken(token);
            Long userId = Long.parseLong(claims.getSubject());
            String username = claims.get("username", String.class);
            Object roleObj = claims.get("role");
            int role = roleObj == null ? 0 : ((Number) roleObj).intValue();
            UserContext.set(userId, username, role);
        } catch (Exception e) {
            return writeError(response, 401, "未登录或登录已过期");
        }

        // 管理员权限校验：审核类接口允许管理员与信任账号，其余管理类接口仅管理员
        if (request.getRequestURI().startsWith("/api/admin/")) {
            boolean allowed = isReviewEndpoint(request) ? UserContext.canReview() : UserContext.isAdmin();
            if (!allowed) {
                return writeError(response, 403, "无权限");
            }
        }
        return true;
    }

    /**
     * 判断是否为「审核类」接口（信任账号可访问）：
     * 审核通过/驳回、批量审核、待审核列表、纠错处理
     */
    private boolean isReviewEndpoint(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.endsWith("/pending")
                || uri.endsWith("/approve")
                || uri.endsWith("/reject")
                || uri.endsWith("/batch-approve")
                || uri.endsWith("/handle");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // 防止线程复用导致数据串扰
        UserContext.clear();
    }

    /**
     * 直接向响应写入统一格式错误信息
     */
    private boolean writeError(HttpServletResponse response, int code, String message) throws Exception {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(Result.fail(code, message)));
        return false;
    }
}