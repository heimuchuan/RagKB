package com.campus.knowledge.security;

/**
 * 当前登录用户上下文（基于 ThreadLocal）
 */
public class UserContext {

    private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> USERNAME = new ThreadLocal<>();
    private static final ThreadLocal<Integer> ROLE = new ThreadLocal<>();

    private UserContext() {
    }

    /**
     * 设置当前登录用户信息
     */
    public static void set(Long userId, String username, Integer role) {
        USER_ID.set(userId);
        USERNAME.set(username);
        ROLE.set(role);
    }

    /**
     * 获取当前用户ID
     */
    public static Long getUserId() {
        return USER_ID.get();
    }

    /**
     * 获取当前用户名
     */
    public static String getUsername() {
        return USERNAME.get();
    }

    /**
     * 获取当前用户角色
     */
    public static Integer getRole() {
        return ROLE.get();
    }

    /**
     * 是否为管理员
     */
    public static boolean isAdmin() {
        Integer role = ROLE.get();
        return role != null && role == 1;
    }

    /**
     * 是否为信任账号（可协助审核）
     */
    public static boolean isReviewer() {
        Integer role = ROLE.get();
        return role != null && role == 2;
    }

    /**
     * 是否具备审核权限（管理员或信任账号）
     */
    public static boolean canReview() {
        return isAdmin() || isReviewer();
    }

    /**
     * 清理上下文（请求结束后调用）
     */
    public static void clear() {
        USER_ID.remove();
        USERNAME.remove();
        ROLE.remove();
    }
}