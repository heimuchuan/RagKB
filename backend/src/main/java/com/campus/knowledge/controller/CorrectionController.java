package com.campus.knowledge.controller;

import com.campus.knowledge.common.Result;
import com.campus.knowledge.dto.CorrectionHandleRequest;
import com.campus.knowledge.dto.CorrectionRequest;
import com.campus.knowledge.entity.CorrectionFeedback;
import com.campus.knowledge.service.CorrectionService;
import com.campus.knowledge.vo.PageVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 纠错反馈接口
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CorrectionController {

    private final CorrectionService correctionService;

    /**
     * 提交纠错
     */
    @PostMapping("/corrections")
    public Result<Void> submit(@Valid @RequestBody CorrectionRequest request) {
        correctionService.submit(request);
        return Result.ok();
    }

    /**
     * 获取我的纠错记录
     */
    @GetMapping("/corrections/my")
    public Result<PageVO<CorrectionFeedback>> my(@RequestParam(defaultValue = "1") long current,
                                                 @RequestParam(defaultValue = "10") long size) {
        return Result.ok(PageVO.of(correctionService.myList(current, size)));
    }

    /**
     * 获取待处理纠错列表（管理员端）
     */
    @GetMapping("/admin/corrections/pending")
    public Result<PageVO<CorrectionFeedback>> pending(@RequestParam(defaultValue = "1") long current,
                                                      @RequestParam(defaultValue = "10") long size) {
        return Result.ok(PageVO.of(correctionService.pendingList(current, size)));
    }

    /**
     * 处理纠错（采纳/拒绝）
     */
    @PostMapping("/admin/corrections/{id}/handle")
    public Result<Void> handle(@PathVariable Long id, @Valid @RequestBody CorrectionHandleRequest request) {
        correctionService.handle(id, request.getStatus(), request.getReply());
        return Result.ok();
    }
}