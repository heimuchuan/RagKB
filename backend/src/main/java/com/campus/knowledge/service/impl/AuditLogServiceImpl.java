package com.campus.knowledge.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.knowledge.entity.AuditLog;
import com.campus.knowledge.mapper.AuditLogMapper;
import com.campus.knowledge.service.AuditLogService;
import org.springframework.stereotype.Service;

/**
 * 审核日志服务实现
 */
@Service
public class AuditLogServiceImpl extends ServiceImpl<AuditLogMapper, AuditLog> implements AuditLogService {

    @Override
    public void record(Long entryId, Long adminId, Integer action, String comment) {
        AuditLog log = new AuditLog();
        log.setEntryId(entryId);
        log.setAdminId(adminId);
        log.setAction(action);
        log.setComment(comment);
        save(log);
    }
}