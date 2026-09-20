package com.campus.knowledge.service;

import com.campus.knowledge.entity.Category;

import java.util.List;

/**
 * 分类服务
 */
public interface CategoryService {

    /**
     * 获取所有分类（按排序权重倒序）
     */
    List<Category> listAll();

    /**
     * 新增分类
     */
    void add(Category category);

    /**
     * 编辑分类
     */
    void update(Category category);

    /**
     * 删除分类（存在关联条目时禁止删除）
     */
    void delete(Long id);
}