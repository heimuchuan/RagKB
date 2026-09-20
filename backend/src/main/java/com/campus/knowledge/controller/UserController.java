package com.campus.knowledge.controller;

import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.common.Result;
import com.campus.knowledge.dto.RoleUpdateRequest;
import com.campus.knowledge.security.UserContext;
import com.campus.knowledge.service.UserService;
import com.campus.knowledge.vo.PageVO;
import com.campus.knowledge.vo.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户管理接口（管理员端）
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 分页查询用户列表
     */
    @GetMapping
    public Result<PageVO<UserVO>> list(@RequestParam(defaultValue = "1") long current,
                                       @RequestParam(defaultValue = "10") long size,
                                       @RequestParam(required = false) String keyword) {
        return Result.ok(PageVO.of(userService.pageUsers(current, size, keyword)));
    }

    /**
     * 设置用户角色（0=学生，1=管理员，2=信任账号）
     */
    @PutMapping("/{id}/role")
    public Result<Void> updateRole(@PathVariable Long id, @Valid @RequestBody RoleUpdateRequest request) {
        if (id.equals(UserContext.getUserId())) {
            throw new BusinessException("不能修改自己的角色");
        }
        userService.updateRole(id, request.getRole());
        return Result.ok();
    }
}