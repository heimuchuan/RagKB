package com.campus.knowledge.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.dto.CorrectionRequest;
import com.campus.knowledge.entity.CorrectionFeedback;
import com.campus.knowledge.entity.KnowledgeEntry;
import com.campus.knowledge.mapper.CorrectionFeedbackMapper;
import com.campus.knowledge.mapper.KnowledgeEntryMapper;
import com.campus.knowledge.security.UserContext;
import com.campus.knowledge.service.CorrectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 纠错反馈服务实现
 */
@Service
@RequiredArgsConstructor
public class CorrectionServiceImpl extends ServiceImpl<CorrectionFeedbackMapper, CorrectionFeedback>
        implements CorrectionService {

    private final KnowledgeEntryMapper knowledgeEntryMapper;

    @Override
    public void submit(CorrectionRequest request) {
        KnowledgeEntry entry = knowledgeEntryMapper.selectById(request.getEntryId());
        if (entry == null) {
            throw new BusinessException("条目不存在");
        }
        if (entry.getSourceType() != null && entry.getSourceType() == 1) {
            throw new BusinessException(403, "官方内容不支持纠错，如有问题请联系管理员");
        }
        CorrectionFeedback feedback = new CorrectionFeedback();
        feedback.setEntryId(request.getEntryId());
        feedback.setReporterId(UserContext.getUserId());
        feedback.setOriginalContent(request.getOriginalContent());
        feedback.setSuggestedContent(request.getSuggestedContent());
        feedback.setReason(request.getReason());
        feedback.setStatus(0);
        save(feedback);
    }

    @Override
    public IPage<CorrectionFeedback> myList(long current, long size) {
        return page(new Page<>(current, size), new LambdaQueryWrapper<CorrectionFeedback>()
                .eq(CorrectionFeedback::getReporterId, UserContext.getUserId())
                .orderByDesc(CorrectionFeedback::getCreatedAt));
    }

    @Override
    public IPage<CorrectionFeedback> pendingList(long current, long size) {
        return page(new Page<>(current, size), new LambdaQueryWrapper<CorrectionFeedback>()
                .eq(CorrectionFeedback::getStatus, 0)
                .orderByAsc(CorrectionFeedback::getCreatedAt));
    }

    @Override
    public void handle(Long id, Integer status, String reply) {
        CorrectionFeedback feedback = getById(id);
        if (feedback == null) {
            throw new BusinessException("纠错记录不存在");
        }
        if (feedback.getStatus() == null || feedback.getStatus() != 0) {
            throw new BusinessException("该纠错已处理");
        }
        feedback.setStatus(status);
        feedback.setAdminReply(reply);
        feedback.setHandledAt(LocalDateTime.now());
        updateById(feedback);

        // 采纳时用建议内容更新原条目
        if (status != null && status == 1 && feedback.getEntryId() != null
                && feedback.getSuggestedContent() != null && !feedback.getSuggestedContent().isBlank()) {
            KnowledgeEntry entry = knowledgeEntryMapper.selectById(feedback.getEntryId());
            if (entry != null) {
                entry.setContent(feedback.getSuggestedContent());
                knowledgeEntryMapper.updateById(entry);
            }
        }
    }
}