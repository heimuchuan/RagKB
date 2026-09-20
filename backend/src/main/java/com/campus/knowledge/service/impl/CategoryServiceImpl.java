package com.campus.knowledge.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.entity.Category;
import com.campus.knowledge.entity.KnowledgeEntry;
import com.campus.knowledge.mapper.CategoryMapper;
import com.campus.knowledge.mapper.KnowledgeEntryMapper;
import com.campus.knowledge.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 分类服务实现
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryMapper categoryMapper;
    private final KnowledgeEntryMapper knowledgeEntryMapper;

    @Override
    public List<Category> listAll() {
        return categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .orderByDesc(Category::getSortOrder)
                .orderByAsc(Category::getId));
    }

    @Override
    public void add(Category category) {
        if (category.getSortOrder() == null) {
            category.setSortOrder(0);
        }
        categoryMapper.insert(category);
    }

    @Override
    public void update(Category category) {
        if (category.getId() == null) {
            throw new BusinessException("分类ID不能为空");
        }
        categoryMapper.updateById(category);
    }

    @Override
    public void delete(Long id) {
        Long count = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getCategoryId, id));
        if (count != null && count > 0) {
            throw new BusinessException("该分类下存在知识条目，无法删除");
        }
        categoryMapper.deleteById(id);
    }
}