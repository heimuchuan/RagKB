package com.campus.knowledge.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.knowledge.entity.CorrectionFeedback;
import org.apache.ibatis.annotations.Mapper;

/**
 * 纠错反馈表 Mapper
 */
@Mapper
public interface CorrectionFeedbackMapper extends BaseMapper<CorrectionFeedback> {
}