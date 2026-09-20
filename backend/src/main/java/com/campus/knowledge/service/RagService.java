package com.campus.knowledge.service;

import com.campus.knowledge.vo.SourceRefVO;

import java.util.List;
import java.util.Map;

/**
 * RAG 服务（文本分块、向量化、检索、问答）
 * 依赖 Chroma + BGE-M3 + LLM 外部服务，当前提供骨架，后续接入。
 */
public interface RagService {

    /**
     * 文本清洗 + 分块（每块 chunk-size 字，重叠 chunk-overlap 字）
     */
    List<String> chunkText(String text);

    /**
     * 向量化（调用 BGE-M3 Embedding 服务）
     */
    List<double[]> embed(List<String> texts);

    /**
     * 知识片段向量化后写入向量库，返回向量库记录ID
     * sourceType：0=学生经验，1=官方（官方内容检索时加权）
     */
    String store(Long entryId, String title, Long categoryId, Integer sourceType, List<String> chunks);

    /**
     * 在向量库中检索与问题最相似的片段（Top-K）
     */
    List<SourceRefVO> search(String query);

    /**
     * 拼接 Prompt 调用大模型生成回答
     * history：多轮对话历史，每条为 {role: user/assistant, content: 内容}，按时间升序
     */
    String answer(String question, List<SourceRefVO> sources, List<Map<String, String>> history);

    /**
     * 理解用户问题意图，生成简洁会话标题（失败时返回 null 交由调用方回退）
     */
    String summarizeTitle(String question);

    /**
     * 删除向量库中的记录
     */
    void removeByEntryId(Long entryId);
}