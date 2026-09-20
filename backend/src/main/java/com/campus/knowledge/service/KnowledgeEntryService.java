package com.campus.knowledge.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.campus.knowledge.dto.EntrySubmitRequest;
import com.campus.knowledge.entity.KnowledgeEntry;

/**
 * 知识条目服务（学生端）
 */
public interface KnowledgeEntryService {

    /**
     * 提交知识条目（待审核）
     */
    Long submit(EntrySubmitRequest request);

    /**
     * 获取我的提交（分页，可按状态筛选）
     */
    IPage<KnowledgeEntry> myEntries(long current, long size, Integer status);

    /**
     * 获取条目详情
     */
    KnowledgeEntry detail(Long id);

    /**
     * 更新草稿（仅待审核状态可修改）
     */
    void updateDraft(Long id, EntrySubmitRequest request);

    /**
     * 删除条目（仅待审核状态可删除）
     */
    void delete(Long id);

    /**
     * 公开浏览知识库（仅已通过，支持分类/关键词筛选）
     */
    IPage<KnowledgeEntry> publicList(long current, long size, Long categoryId, String keyword);

    /**
     * 点赞/点踩条目
     */
    void feedback(Long id, Integer type);
}