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
import com.campus.knowledge.service.KnowledgeEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 知识条目服务实现（学生端）
 */
@Service
@RequiredArgsConstructor
public class KnowledgeEntryServiceImpl extends ServiceImpl<KnowledgeEntryMapper, KnowledgeEntry>
        implements KnowledgeEntryService {

    @Override
    public Long submit(EntrySubmitRequest request) {
        KnowledgeEntry entry = new KnowledgeEntry();
        entry.setTitle(request.getTitle());
        entry.setCategoryId(request.getCategoryId());
        entry.setContent(request.getContent());
        entry.setSubmitterId(UserContext.getUserId());
        entry.setStatus(0);
        entry.setViewCount(0);
        save(entry);
        return entry.getId();
    }

    @Override
    public IPage<KnowledgeEntry> myEntries(long current, long size, Integer status) {
        LambdaQueryWrapper<KnowledgeEntry> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEntry::getSubmitterId, UserContext.getUserId());
        if (status != null) {
            wrapper.eq(KnowledgeEntry::getStatus, status);
        }
        wrapper.orderByDesc(KnowledgeEntry::getCreatedAt);
        return page(new Page<>(current, size), wrapper);
    }

    @Override
    public KnowledgeEntry detail(Long id) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        // 浏览次数 +1
        entry.setViewCount((entry.getViewCount() == null ? 0 : entry.getViewCount()) + 1);
        updateById(entry);
        return entry;
    }

    @Override
    public void updateDraft(Long id, EntrySubmitRequest request) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        if (!UserContext.getUserId().equals(entry.getSubmitterId())) {
            throw new BusinessException(403, "无权操作他人条目");
        }
        if (entry.getStatus() == null || entry.getStatus() != 0) {
            throw new BusinessException("仅待审核状态可修改");
        }
        entry.setTitle(request.getTitle());
        entry.setCategoryId(request.getCategoryId());
        entry.setContent(request.getContent());
        updateById(entry);
    }

    @Override
    public void delete(Long id) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        if (!UserContext.getUserId().equals(entry.getSubmitterId())) {
            throw new BusinessException(403, "无权操作他人条目");
        }
        if (entry.getStatus() == null || entry.getStatus() != 0) {
            throw new BusinessException("仅待审核状态可删除");
        }
        removeById(id);
    }

    @Override
    public IPage<KnowledgeEntry> publicList(long current, long size, Long categoryId, String keyword) {
        LambdaQueryWrapper<KnowledgeEntry> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(KnowledgeEntry::getStatus, 1);
        if (categoryId != null) {
            wrapper.eq(KnowledgeEntry::getCategoryId, categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(KnowledgeEntry::getTitle, keyword)
                    .or().like(KnowledgeEntry::getContent, keyword));
        }
        wrapper.orderByDesc(KnowledgeEntry::getApprovedAt);
        return page(new Page<>(current, size), wrapper);
    }

    @Override
    public void feedback(Long id, Integer type) {
        KnowledgeEntry entry = getById(id);
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        // TODO: 当前表结构未设计条目的点赞/点踩独立字段，暂以 view_count 记录互动次数，
        //  后续可新增 feedback 表细化点赞/点踩统计。
        entry.setViewCount((entry.getViewCount() == null ? 0 : entry.getViewCount()) + 1);
        updateById(entry);
    }
}