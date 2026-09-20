package com.campus.knowledge.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 智能问答返回结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AskVO {

    /** 问答记录ID */
    private Long id;

    /** 回答内容 */
    private String answer;

    /** 引用来源列表 */
    private List<SourceRefVO> sources;

    /** 会话ID（多轮对话） */
    private String sessionId;
}