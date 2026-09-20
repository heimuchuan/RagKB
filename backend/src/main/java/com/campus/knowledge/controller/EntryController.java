package com.campus.knowledge.controller;

import com.campus.knowledge.common.Result;
import com.campus.knowledge.dto.EntrySubmitRequest;
import com.campus.knowledge.dto.FeedbackRequest;
import com.campus.knowledge.entity.KnowledgeEntry;
import com.campus.knowledge.service.KnowledgeEntryService;
import com.campus.knowledge.vo.PageVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 知识条目接口（学生端）
 */
@RestController
@RequestMapping("/api/entries")
@RequiredArgsConstructor
public class EntryController {

    private final KnowledgeEntryService knowledgeEntryService;

    /**
     * 提交知识条目
     */
    @PostMapping
    public Result<Long> submit(@Valid @RequestBody EntrySubmitRequest request) {
        return Result.ok(knowledgeEntryService.submit(request));
    }

    /**
     * 获取我的提交记录（分页，可按状态筛选）
     */
    @GetMapping("/my")
    public Result<PageVO<KnowledgeEntry>> my(@RequestParam(defaultValue = "1") long current,
                                             @RequestParam(defaultValue = "10") long size,
                                             @RequestParam(required = false) Integer status) {
        return Result.ok(PageVO.of(knowledgeEntryService.myEntries(current, size, status)));
    }

    /**
     * 浏览知识库（仅已通过，支持分类/关键词筛选）
     */
    @GetMapping("/public")
    public Result<PageVO<KnowledgeEntry>> publicList(@RequestParam(defaultValue = "1") long current,
                                                     @RequestParam(defaultValue = "10") long size,
                                                     @RequestParam(required = false) Long categoryId,
                                                     @RequestParam(required = false) String keyword) {
        return Result.ok(PageVO.of(knowledgeEntryService.publicList(current, size, categoryId, keyword)));
    }

    /**
     * 获取条目详情
     */
    @GetMapping("/{id}")
    public Result<KnowledgeEntry> detail(@PathVariable Long id) {
        return Result.ok(knowledgeEntryService.detail(id));
    }

    /**
     * 更新草稿（仅待审核状态可修改）
     */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody EntrySubmitRequest request) {
        knowledgeEntryService.updateDraft(id, request);
        return Result.ok();
    }

    /**
     * 删除条目（仅待审核状态可删除）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        knowledgeEntryService.delete(id);
        return Result.ok();
    }

    /**
     * 点赞/点踩条目
     */
    @PostMapping("/{id}/feedback")
    public Result<Void> feedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest request) {
        knowledgeEntryService.feedback(id, request.getType());
        return Result.ok();
    }
}