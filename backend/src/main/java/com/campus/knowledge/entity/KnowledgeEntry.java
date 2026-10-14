package com.campus.knowledge.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 知识条目表实体
 * 状态：0=待审核，1=已通过，2=已驳回
 */
@Data
@TableName("knowledge_entry")
public class KnowledgeEntry {

    /** 主键 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 标题 */
    private String title;

    /** 正文内容 */
    private String content;

    /** 附件列表（JSON 字符串：[{name,url,type,size}]） */
    private String attachment;

    /** 所属分类ID（→ category.id） */
    private Long categoryId;

    /** 来源：0=学生经验，1=官方 */
    private Integer sourceType;

    /** 提交者ID（→ user.id） */
    private Long submitterId;

    /** 状态：0=待审核，1=已通过，2=已驳回 */
    private Integer status;

    /** 驳回原因 */
    private String rejectReason;

    /** 向量库中的ID */
    private String vectorId;

    /** 浏览次数 */
    private Integer viewCount;

    /** 提交时间 */
    private LocalDateTime createdAt;

    /** 审核通过时间 */
    private LocalDateTime approvedAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}