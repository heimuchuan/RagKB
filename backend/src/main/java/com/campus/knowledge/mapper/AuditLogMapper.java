package com.campus.knowledge.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.knowledge.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 审核日志表 Mapper
 */
@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}