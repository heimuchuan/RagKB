package com.campus.knowledge.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 问答会话摘要（多轮对话列表项）
 */
@Data
public class SessionVO {

    /** 会话ID */
    private String sessionId;

    /** 首条问题（作为会话标题） */
    private String title;

    /** 最近一次提问时间 */
    private LocalDateTime lastTime;

    /** 问答轮数 */
    private Integer cnt;
}