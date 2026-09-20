package com.campus.knowledge.service;

/**
 * 审核日志服务
 */
public interface AuditLogService {

    /**
     * 记录审核日志
     *
     * @param entryId 条目ID
     * @param adminId 审核人ID
     * @param action  操作：1=通过，2=驳回
     * @param comment 审核意见
     */
    void record(Long entryId, Long adminId, Integer action, String comment);
}