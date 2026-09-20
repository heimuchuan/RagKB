package com.campus.knowledge.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.knowledge.entity.QaRecord;
import com.campus.knowledge.vo.SessionVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 问答记录表 Mapper
 */
@Mapper
public interface QaRecordMapper extends BaseMapper<QaRecord> {

    /**
     * 查询当前用户的会话列表（按最近提问时间倒序）
     */
    @Select("SELECT q.session_id, " +
            "  COALESCE((SELECT title FROM qa_record WHERE session_id = q.session_id AND title IS NOT NULL ORDER BY id ASC LIMIT 1), " +
            "           (SELECT question FROM qa_record WHERE session_id = q.session_id ORDER BY id ASC LIMIT 1)) AS title, " +
            "  MAX(q.created_at) AS last_time, " +
            "  COUNT(*) AS cnt " +
            "FROM qa_record q " +
            "WHERE q.user_id = #{userId} AND q.session_id IS NOT NULL " +
            "GROUP BY q.session_id " +
            "ORDER BY last_time DESC")
    List<SessionVO> listSessions(@Param("userId") Long userId);
}