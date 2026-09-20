package com.campus.knowledge.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.campus.knowledge.entity.Category;
import com.campus.knowledge.entity.KnowledgeEntry;
import com.campus.knowledge.entity.QaRecord;
import com.campus.knowledge.entity.User;
import com.campus.knowledge.mapper.CategoryMapper;
import com.campus.knowledge.mapper.KnowledgeEntryMapper;
import com.campus.knowledge.mapper.QaRecordMapper;
import com.campus.knowledge.mapper.UserMapper;
import com.campus.knowledge.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据统计服务实现
 */
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final KnowledgeEntryMapper knowledgeEntryMapper;
    private final QaRecordMapper qaRecordMapper;
    private final CategoryMapper categoryMapper;
    private final UserMapper userMapper;

    @Override
    public Map<String, Object> submissions() {
        Map<String, Object> result = new LinkedHashMap<>();
        long total = knowledgeEntryMapper.selectCount(null);
        long pending = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getStatus, 0));
        long approved = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getStatus, 1));
        long rejected = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getStatus, 2));
        double passRate = (approved + rejected) == 0 ? 0 : (double) approved / (approved + rejected) * 100;

        // 近 7 日提交趋势
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end = day.plusDays(1).atStartOfDay();
            long count = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                    .ge(KnowledgeEntry::getCreatedAt, start)
                    .lt(KnowledgeEntry::getCreatedAt, end));
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("date", day.toString());
            item.put("count", count);
            trend.add(item);
        }

        result.put("total", total);
        result.put("pending", pending);
        result.put("approved", approved);
        result.put("rejected", rejected);
        result.put("passRate", Math.round(passRate * 100.0) / 100.0);
        result.put("trend", trend);
        return result;
    }

    @Override
    public Map<String, Object> qa() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hotQuestions", hotQuestions());
        result.put("negativeQuestions", negativeQuestions());
        return result;
    }

    /**
     * 热门问题 Top10（按提问次数排序）
     */
    private List<Map<String, Object>> hotQuestions() {
        QueryWrapper<QaRecord> wrapper = new QueryWrapper<>();
        wrapper.select("question", "COUNT(*) AS cnt", "MAX(created_at) AS last_time");
        wrapper.groupBy("question");
        wrapper.orderByDesc("cnt");
        wrapper.last("LIMIT 10");
        return qaRecordMapper.selectMaps(wrapper);
    }

    /**
     * 点踩最多问题（feedback=2）
     */
    private List<Map<String, Object>> negativeQuestions() {
        QueryWrapper<QaRecord> wrapper = new QueryWrapper<>();
        wrapper.select("question", "COUNT(*) AS cnt");
        wrapper.eq("feedback", 2);
        wrapper.groupBy("question");
        wrapper.orderByDesc("cnt");
        wrapper.last("LIMIT 10");
        return qaRecordMapper.selectMaps(wrapper);
    }

    @Override
    public Map<String, Object> contributors() {
        QueryWrapper<KnowledgeEntry> wrapper = new QueryWrapper<>();
        wrapper.select("submitter_id", "COUNT(*) AS cnt");
        wrapper.groupBy("submitter_id");
        wrapper.orderByDesc("cnt");
        wrapper.last("LIMIT 20");
        List<Map<String, Object>> rows = knowledgeEntryMapper.selectMaps(wrapper);

        List<Map<String, Object>> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Object sid = row.get("submitter_id");
            if (sid == null) {
                continue;
            }
            Long submitterId = ((Number) sid).longValue();
            long total = row.get("cnt") == null ? 0 : ((Number) row.get("cnt")).longValue();
            long approved = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                    .eq(KnowledgeEntry::getSubmitterId, submitterId)
                    .eq(KnowledgeEntry::getStatus, 1));
            User user = userMapper.selectById(submitterId);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("userId", submitterId);
            item.put("username", user == null ? "" : user.getUsername());
            item.put("realName", user == null ? "" : user.getRealName());
            item.put("total", total);
            item.put("approved", approved);
            item.put("passRate", total == 0 ? 0 : Math.round((double) approved / total * 10000.0) / 100.0);
            list.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", list);
        return result;
    }

    @Override
    public Map<String, Object> overview() {
        Map<String, Object> result = new LinkedHashMap<>();
        long total = knowledgeEntryMapper.selectCount(null);
        long pending = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getStatus, 0));
        long approved = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getStatus, 1));
        long rejected = knowledgeEntryMapper.selectCount(new LambdaQueryWrapper<KnowledgeEntry>()
                .eq(KnowledgeEntry::getStatus, 2));

        // 分类分布
        QueryWrapper<KnowledgeEntry> wrapper = new QueryWrapper<>();
        wrapper.select("category_id", "COUNT(*) AS cnt");
        wrapper.groupBy("category_id");
        List<Map<String, Object>> rows = knowledgeEntryMapper.selectMaps(wrapper);
        List<Map<String, Object>> categories = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Object cid = row.get("category_id");
            Long categoryId = cid == null ? null : ((Number) cid).longValue();
            Category category = categoryId == null ? null : categoryMapper.selectById(categoryId);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("categoryId", categoryId);
            item.put("name", category == null ? "未分类" : category.getName());
            item.put("count", row.get("cnt") == null ? 0 : ((Number) row.get("cnt")).longValue());
            categories.add(item);
        }

        result.put("total", total);
        result.put("pending", pending);
        result.put("approved", approved);
        result.put("rejected", rejected);
        result.put("categories", categories);
        return result;
    }
}