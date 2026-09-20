package com.campus.knowledge.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.dto.EntrySubmitRequest;
import com.campus.knowledge.entity.KnowledgeEntry;
import com.campus.knowledge.mapper.KnowledgeEntryMapper;
import com.campus.knowledge.security.UserContext;
import com.campus.knowledge.service.AdminEntryService;
import com.campus.knowledge.service.AuditLogService;
import com.campus.knowledge.service.RagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 知识条目服务实现（管理员端）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminEntryServiceImpl extends ServiceImpl<KnowledgeEntryMapper, KnowledgeEntry>
        implements AdminEntryService {

    private final AuditLogService auditLogService;
    private final RagService ragService;

    @Override
    public IPage<KnowledgeEntry> pendingList(long current, long size) {
        return page(new Page<>(current, size), new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getStatus, 0)
                .orderByAsc(KnowledgeEntry::getCreatedAt));
    }

    @Override
    public void approve(Long id) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        if (entry.getStatus() == null || entry.getStatus() != 0) {
            throw new BusinessException("仅待审核条目可审核");
        }
        entry.setStatus(1);
        entry.setApprovedAt(LocalDateTime.now());
        entry.setRejectReason(null);
        // 学生提交条目：来源为学生经验
        if (entry.getSourceType() == null) {
            entry.setSourceType(0);
        }
        vectorize(entry);
        updateById(entry);
        auditLogService.record(id, UserContext.getUserId(), 1, "审核通过");
    }

    @Override
    public Long createOfficial(EntrySubmitRequest request) {
        KnowledgeEntry entry = new KnowledgeEntry();
        entry.setTitle(request.getTitle());
        entry.setCategoryId(request.getCategoryId());
        entry.setContent(request.getContent());
        entry.setSubmitterId(UserContext.getUserId());
        entry.setStatus(1);
        entry.setSourceType(1);
        entry.setApprovedAt(LocalDateTime.now());
        entry.setViewCount(0);
        save(entry);
        vectorize(entry);
        updateById(entry);
        auditLogService.record(entry.getId(), UserContext.getUserId(), 1, "官方录入");
        return entry.getId();
    }

    /** 分块向量化并写入 Chroma，回填 vector_id（失败不阻塞主流程） */
    private void vectorize(KnowledgeEntry entry) {
        try {
            List<String> chunks = ragService.chunkText(entry.getContent());
            String vectorId = ragService.store(entry.getId(), entry.getTitle(), entry.getCategoryId(), entry.getSourceType(), chunks);
            entry.setVectorId(vectorId);
        } catch (Exception e) {
            log.warn("向量化入库失败：{}", e.getMessage());
        }
    }

    @Override
    public void reject(Long id, String reason) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        if (entry.getStatus() == null || entry.getStatus() != 0) {
            throw new BusinessException("仅待审核条目可审核");
        }
        entry.setStatus(2);
        entry.setRejectReason(reason);
        updateById(entry);
        auditLogService.record(id, UserContext.getUserId(), 2, reason);
    }

    @Override
    public int batchApprove(List<Long> ids) {
        int success = 0;
        for (Long id : ids) {
            try {
                approve(id);
                success++;
            } catch (BusinessException e) {
                log.warn("批量审核跳过条目 {}：{}", id, e.getMessage());
            }
        }
        return success;
    }

    @Override
    public IPage<KnowledgeEntry> listAll(long current, long size, Integer status, Long categoryId,
                                         LocalDateTime startTime, LocalDateTime endTime) {
        LambdaQueryWrapper<KnowledgeEntry> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(KnowledgeEntry::getStatus, status);
        }
        if (categoryId != null) {
            wrapper.eq(KnowledgeEntry::getCategoryId, categoryId);
        }
        if (startTime != null) {
            wrapper.ge(KnowledgeEntry::getCreatedAt, startTime);
        }
        if (endTime != null) {
            wrapper.le(KnowledgeEntry::getCreatedAt, endTime);
        }
        wrapper.orderByDesc(KnowledgeEntry::getCreatedAt);
        return page(new Page<>(current, size), wrapper);
    }

    @Override
    public void update(Long id, EntrySubmitRequest request) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        entry.setTitle(request.getTitle());
        entry.setCategoryId(request.getCategoryId());
        entry.setContent(request.getContent());
        updateById(entry);
        // TODO: 已入库条目内容变更后，需同步更新向量库中的向量
    }

    @Override
    public void delete(Long id) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        removeById(id);
        // TODO: 同步删除向量库中的记录
        ragService.removeByEntryId(id);
    }
}