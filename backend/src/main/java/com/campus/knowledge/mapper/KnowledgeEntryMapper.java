package com.campus.knowledge.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.knowledge.entity.KnowledgeEntry;
import org.apache.ibatis.annotations.Mapper;

/**
 * 知识条目表 Mapper
 */
@Mapper
public interface KnowledgeEntryMapper extends BaseMapper<KnowledgeEntry> {
}