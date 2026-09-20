package com.campus.knowledge.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 问答记录表实体
 * 反馈：0=无，1=点赞，2=点踩
 */
@Data
@TableName("qa_record")
public class QaRecord {

    /** 主键 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户问题 */
    private String question;

    /** AI 回答 */
    private String answer;

    /** 引用来源列表（JSON 字符串） */
    private String sources;

    /** 提问者ID（→ user.id） */
    private Long userId;

    /** 会话ID（多轮对话） */
    private String sessionId;

    /** 会话标题（首条记录智能生成，便于会话列表展示） */
    private String title;

    /** 反馈：0=无，1=点赞，2=点踩 */
    private Integer feedback;

    /** 点踩时填写的原因 */
    private String feedbackContent;

    /** 提问时间 */
    private LocalDateTime createdAt;
}