package com.campus.knowledge.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.campus.knowledge.dto.CorrectionRequest;
import com.campus.knowledge.entity.CorrectionFeedback;

/**
 * 纠错反馈服务
 */
public interface CorrectionService {

    /**
     * 提交纠错
     */
    void submit(CorrectionRequest request);

    /**
     * 获取我的纠错记录（分页）
     */
    IPage<CorrectionFeedback> myList(long current, long size);

    /**
     * 获取待处理纠错列表（分页，管理员端）
     */
    IPage<CorrectionFeedback> pendingList(long current, long size);

    /**
     * 处理纠错（采纳/拒绝）
     */
    void handle(Long id, Integer status, String reply);
}