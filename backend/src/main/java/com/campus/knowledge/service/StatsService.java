package com.campus.knowledge.service;

import java.util.Map;

/**
 * 数据统计服务（管理员端）
 */
public interface StatsService {

    /**
     * 提交统计：按日统计提交量、通过率
     */
    Map<String, Object> submissions();

    /**
     * 问答统计：热门问题 Top10、点踩最多问题
     */
    Map<String, Object> qa();

    /**
     * 用户贡献排行：按提交量、通过率排序
     */
    Map<String, Object> contributors();

    /**
     * 知识库概览：总条目数、待审核数、分类分布
     */
    Map<String, Object> overview();
}