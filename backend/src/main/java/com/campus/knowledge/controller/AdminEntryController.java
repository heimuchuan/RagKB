package com.campus.knowledge.controller;

import com.campus.knowledge.common.Result;
import com.campus.knowledge.dto.BatchApproveRequest;
import com.campus.knowledge.dto.EntrySubmitRequest;
import com.campus.knowledge.dto.RejectRequest;
import com.campus.knowledge.entity.KnowledgeEntry;
import com.campus.knowledge.service.AdminEntryService;
import com.campus.knowledge.vo.PageVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * 知识条目接口（管理员端）
 */
@RestController
@RequestMapping("/api/admin/entries")
@RequiredArgsConstructor
public class AdminEntryController {

    private final AdminEntryService adminEntryService;

    /**
     * 获取待审核列表
     */
    @GetMapping("/pending")
    public Result<PageVO<KnowledgeEntry>> pending(@RequestParam(defaultValue = "1") long current,
                                                  @RequestParam(defaultValue = "10") long size) {
        return Result.ok(PageVO.of(adminEntryService.pendingList(current, size)));
    }

    /**
     * 官方录入条目（sourceType=1，直接通过并入库）
     */
    @PostMapping("/official")
    public Result<Long> createOfficial(@Valid @RequestBody EntrySubmitRequest request) {
        return Result.ok(adminEntryService.createOfficial(request));
    }

    /**
     * 审核通过
     */
    @PostMapping("/{id}/approve")
    public Result<Void> approve(@PathVariable Long id) {
        adminEntryService.approve(id);
        return Result.ok();
    }

    /**
     * 审核驳回
     */
    @PostMapping("/{id}/reject")
    public Result<Void> reject(@PathVariable Long id, @Valid @RequestBody RejectRequest request) {
        adminEntryService.reject(id, request.getReason());
        return Result.ok();
    }

    /**
     * 批量审核通过
     */
    @PostMapping("/batch-approve")
    public Result<Integer> batchApprove(@Valid @RequestBody BatchApproveRequest request) {
        return Result.ok(adminEntryService.batchApprove(request.getIds()));
    }

    /**
     * 获取所有条目（支持按状态、分类、时间筛选）
     */
    @GetMapping
    public Result<PageVO<KnowledgeEntry>> list(@RequestParam(defaultValue = "1") long current,
                                               @RequestParam(defaultValue = "10") long size,
                                               @RequestParam(required = false) Integer status,
                                               @RequestParam(required = false) Long categoryId,
                                               @RequestParam(required = false)
                                               @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
                                               @RequestParam(required = false)
                                               @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return Result.ok(PageVO.of(adminEntryService.listAll(current, size, status, categoryId, startTime, endTime)));
    }

    /**
     * 编辑条目
     */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody EntrySubmitRequest request) {
        adminEntryService.update(id, request);
        return Result.ok();
    }

    /**
     * 删除条目
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminEntryService.delete(id);
        return Result.ok();
    }
}