package com.campus.knowledge.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.knowledge.entity.Category;
import org.apache.ibatis.annotations.Mapper;

/**
 * 分类表 Mapper
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
}