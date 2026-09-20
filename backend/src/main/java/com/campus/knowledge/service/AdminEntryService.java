package com.campus.knowledge.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.campus.knowledge.dto.EntrySubmitRequest;
import com.campus.knowledge.entity.KnowledgeEntry;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 知识条目服务（管理员端）
 */
public interface AdminEntryService {

    /**
     * 获取待审核列表（分页）
     */
    IPage<KnowledgeEntry> pendingList(long current, long size);

    /**
     * 审核通过（触发向量化入库）
     */
    void approve(Long id);

    /**
     * 官方录入条目（sourceType=1，直接通过并向量化入库）
     */
    Long createOfficial(EntrySubmitRequest request);

    /**
     * 审核驳回
     */
    void reject(Long id, String reason);

    /**
     * 批量审核通过
     */
    int batchApprove(List<Long> ids);

    /**
     * 获取所有条目（支持按状态、分类、时间筛选）
     */
    IPage<KnowledgeEntry> listAll(long current, long size, Integer status, Long categoryId,
                                  LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 编辑条目（管理员可修改已入库内容）
     */
    void update(Long id, EntrySubmitRequest request);

    /**
     * 删除条目（同时删除向量库记录）
     */
    void delete(Long id);
}