package com.campus.knowledge.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 检索引用来源
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SourceRefVO {

    /** 关联条目ID */
    private Long entryId;

    /** 标题 */
    private String title;

    /** 来源：0=学生经验，1=官方 */
    private Integer sourceType;

    /** 内容片段 */
    private String content;
}