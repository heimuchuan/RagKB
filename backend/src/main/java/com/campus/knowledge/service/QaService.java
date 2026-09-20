package com.campus.knowledge.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.campus.knowledge.entity.QaRecord;
import com.campus.knowledge.vo.AskVO;
import com.campus.knowledge.vo.SessionVO;

import java.util.List;

/**
 * 智能问答服务
 */
public interface QaService {

    /**
     * 智能问答（RAG 检索 + LLM 生成）
     * sessionId 为空时新建会话
     */
    AskVO ask(String question, String sessionId);

    /**
     * 获取当前用户的问答历史（分页）
     */
    IPage<QaRecord> history(long current, long size);

    /**
     * 获取当前用户的会话列表
     */
    List<SessionVO> sessions();

    /**
     * 获取某个会话的完整对话内容（按时间升序）
     */
    List<QaRecord> sessionMessages(String sessionId);

    /**
     * 删除当前用户的某个会话及其全部问答记录
     */
    void deleteSession(String sessionId);

    /**
     * 手动重命名当前用户的某个会话标题
     */
    void renameSession(String sessionId, String title);

    /**
     * 问答反馈（点赞/点踩）
     */
    void feedback(Long id, Integer type, String reason);
}