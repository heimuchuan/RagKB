package com.campus.knowledge.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.knowledge.entity.User;
import com.campus.knowledge.vo.UserVO;

/**
 * 用户服务
 */
public interface UserService extends IService<User> {

    /**
     * 按用户名查询用户
     */
    User getByUsername(String username);

    /**
     * 分页查询用户列表（管理员端，隐藏密码）
     */
    IPage<UserVO> pageUsers(long current, long size, String keyword);

    /**
     * 设置用户角色（管理员端）
     */
    void updateRole(Long id, Integer role);
}