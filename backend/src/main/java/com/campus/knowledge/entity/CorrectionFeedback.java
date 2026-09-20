package com.campus.knowledge.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 纠错反馈表实体
 * 状态：0=待处理，1=已采纳，2=已拒绝
 */
@Data
@TableName("correction_feedback")
public class CorrectionFeedback {

    /** 主键 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联的知识条目ID（→ knowledge_entry.id） */
    private Long entryId;

    /** 报告者ID（→ user.id） */
    private Long reporterId;

    /** 原文内容 */
    private String originalContent;

    /** 建议修正内容 */
    private String suggestedContent;

    /** 纠错原因 */
    private String reason;

    /** 状态：0=待处理，1=已采纳，2=已拒绝 */
    private Integer status;

    /** 管理员回复 */
    private String adminReply;

    /** 提交时间 */
    private LocalDateTime createdAt;

    /** 处理时间 */
    private LocalDateTime handledAt;
}