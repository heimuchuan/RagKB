package com.campus.knowledge.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.entity.QaRecord;
import com.campus.knowledge.mapper.QaRecordMapper;
import com.campus.knowledge.security.UserContext;
import com.campus.knowledge.service.QaService;
import com.campus.knowledge.service.RagService;
import com.campus.knowledge.vo.AskVO;
import com.campus.knowledge.vo.SessionVO;
import com.campus.knowledge.vo.SourceRefVO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 智能问答服务实现
 */
@Service
@RequiredArgsConstructor
public class QaServiceImpl extends ServiceImpl<QaRecordMapper, QaRecord> implements QaService {

    /** 多轮对话保留的最近问答轮数 */
    private static final int MAX_HISTORY_TURNS = 4;

    private final RagService ragService;
    private final ObjectMapper objectMapper;

    @Override
    public AskVO ask(String question, String sessionId) {
        // 无会话则新建会话
        boolean newSession = (sessionId == null || sessionId.isBlank());
        if (newSession) {
            sessionId = UUID.randomUUID().toString().replace("-", "");
        }

        List<SourceRefVO> sources = ragService.search(question);
        List<Map<String, String>> history = buildHistory(sessionId);

        String answer;
        if (sources == null || sources.isEmpty()) {
            answer = "暂无相关信息";
        } else {
            answer = ragService.answer(question, sources, history);
        }

        QaRecord record = new QaRecord();
        record.setQuestion(question);
        record.setAnswer(answer);
        record.setUserId(UserContext.getUserId());
        record.setSessionId(sessionId);
        record.setFeedback(0);
        // 新会话的首条记录：智能生成标题，失败则置空，由列表查询回退到首问
        if (newSession) {
            record.setTitle(ragService.summarizeTitle(question));
        }
        try {
            record.setSources(objectMapper.writeValueAsString(sources));
        } catch (JsonProcessingException e) {
            record.setSources("[]");
        }
        save(record);

        return new AskVO(record.getId(), answer, sources, sessionId);
    }

    @Override
    public IPage<QaRecord> history(long current, long size) {
        return page(new Page<>(current, size), new LambdaQueryWrapper<QaRecord>()
                .eq(QaRecord::getUserId, UserContext.getUserId())
                .orderByDesc(QaRecord::getCreatedAt));
    }

    @Override
    public List<SessionVO> sessions() {
        return baseMapper.listSessions(UserContext.getUserId());
    }

    @Override
    public List<QaRecord> sessionMessages(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return new ArrayList<>();
        }
        return list(new LambdaQueryWrapper<QaRecord>()
                .eq(QaRecord::getUserId, UserContext.getUserId())
                .eq(QaRecord::getSessionId, sessionId)
                .orderByAsc(QaRecord::getId));
    }

    @Override
    public void deleteSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        Long userId = UserContext.getUserId();
        long count = count(new LambdaQueryWrapper<QaRecord>()
                .eq(QaRecord::getUserId, userId)
                .eq(QaRecord::getSessionId, sessionId));
        if (count == 0) {
            throw new BusinessException("会话不存在或已被删除");
        }
        remove(new LambdaQueryWrapper<QaRecord>()
                .eq(QaRecord::getUserId, userId)
                .eq(QaRecord::getSessionId, sessionId));
    }

    @Override
    public void renameSession(String sessionId, String title) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        Long userId = UserContext.getUserId();
        // 找到该会话的首条记录（标题存储在其 title 字段）
        List<QaRecord> first = list(new LambdaQueryWrapper<QaRecord>()
                .eq(QaRecord::getUserId, userId)
                .eq(QaRecord::getSessionId, sessionId)
                .orderByAsc(QaRecord::getId)
                .last("limit 1"));
        if (first.isEmpty()) {
            throw new BusinessException("会话不存在或已被删除");
        }
        QaRecord record = first.get(0);
        record.setTitle(title);
        updateById(record);
    }

    @Override
    public void feedback(Long id, Integer type, String reason) {
        QaRecord record = getById(id);
        if (record == null) {
            throw new BusinessException("问答记录不存在");
        }
        if (!UserContext.getUserId().equals(record.getUserId())) {
            throw new BusinessException(403, "无权操作他人问答记录");
        }
        record.setFeedback(type);
        if (type != null && type == 2) {
            record.setFeedbackContent(reason);
        }
        updateById(record);
    }

    /** 拉取该会话最近的问答历史（升序的 role/content 列表） */
    private List<Map<String, String>> buildHistory(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return new ArrayList<>();
        }
        List<QaRecord> recent = list(new LambdaQueryWrapper<QaRecord>()
                .eq(QaRecord::getUserId, UserContext.getUserId())
                .eq(QaRecord::getSessionId, sessionId)
                .orderByDesc(QaRecord::getId)
                .last("limit " + MAX_HISTORY_TURNS));
        List<Map<String, String>> history = new ArrayList<>();
        for (int i = recent.size() - 1; i >= 0; i--) {
            QaRecord r = recent.get(i);
            history.add(Map.of("role", "user", "content", r.getQuestion()));
            if (r.getAnswer() != null && !r.getAnswer().isBlank()) {
                history.add(Map.of("role", "assistant", "content", r.getAnswer()));
            }
        }
        return history;
    }
}