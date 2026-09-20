package com.campus.knowledge.controller;

import com.campus.knowledge.common.Result;
import com.campus.knowledge.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 数据统计接口（管理员端）
 */
@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final StatsService statsService;

    /**
     * 提交统计
     */
    @GetMapping("/submissions")
    public Result<Map<String, Object>> submissions() {
        return Result.ok(statsService.submissions());
    }

    /**
     * 问答统计
     */
    @GetMapping("/qa")
    public Result<Map<String, Object>> qa() {
        return Result.ok(statsService.qa());
    }

    /**
     * 用户贡献排行
     */
    @GetMapping("/contributors")
    public Result<Map<String, Object>> contributors() {
        return Result.ok(statsService.contributors());
    }

    /**
     * 知识库概览
     */
    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        return Result.ok(statsService.overview());
    }
}