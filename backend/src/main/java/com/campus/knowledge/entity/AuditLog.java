package com.campus.knowledge.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 审核日志表实体
 * 操作：1=通过，2=驳回
 */
@Data
@TableName("audit_log")
public class AuditLog {

    /** 主键 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联的知识条目ID（→ knowledge_entry.id） */
    private Long entryId;

    /** 审核人ID（→ user.id） */
    private Long adminId;

    /** 操作：1=通过，2=驳回 */
    private Integer action;

    /** 审核意见 */
    private String comment;

    /** 操作时间 */
    private LocalDateTime createdAt;
}