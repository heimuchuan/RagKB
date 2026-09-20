package com.campus.knowledge.controller;

import com.campus.knowledge.common.Result;
import com.campus.knowledge.entity.Category;
import com.campus.knowledge.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 分类接口
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 获取所有分类
     */
    @GetMapping("/categories")
    public Result<List<Category>> list() {
        return Result.ok(categoryService.listAll());
    }

    /**
     * 新增分类（管理员端）
     */
    @PostMapping("/admin/categories")
    public Result<Void> add(@Valid @RequestBody Category category) {
        categoryService.add(category);
        return Result.ok();
    }

    /**
     * 编辑分类（管理员端）
     */
    @PutMapping("/admin/categories/{id}")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody Category category) {
        category.setId(id);
        categoryService.update(category);
        return Result.ok();
    }

    /**
     * 删除分类（管理员端）
     */
    @DeleteMapping("/admin/categories/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return Result.ok();
    }
}