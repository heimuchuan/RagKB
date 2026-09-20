package com.campus.knowledge.controller;

import com.campus.knowledge.common.Result;
import com.campus.knowledge.dto.AskRequest;
import com.campus.knowledge.dto.FeedbackRequest;
import com.campus.knowledge.dto.SessionTitleRequest;
import com.campus.knowledge.entity.QaRecord;
import com.campus.knowledge.service.QaService;
import com.campus.knowledge.vo.AskVO;
import com.campus.knowledge.vo.PageVO;
import com.campus.knowledge.vo.SessionVO;
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

import java.util.List;

/**
 * 智能问答接口
 */
@RestController
@RequestMapping("/api/qa")
@RequiredArgsConstructor
public class QaController {

    private final QaService qaService;

    /**
     * 智能问答（多轮对话）
     */
    @PostMapping("/ask")
    public Result<AskVO> ask(@Valid @RequestBody AskRequest request) {
        return Result.ok(qaService.ask(request.getQuestion(), request.getSessionId()));
    }

    /**
     * 获取问答历史
     */
    @GetMapping("/history")
    public Result<PageVO<QaRecord>> history(@RequestParam(defaultValue = "1") long current,
                                            @RequestParam(defaultValue = "10") long size) {
        return Result.ok(PageVO.of(qaService.history(current, size)));
    }

    /**
     * 获取当前用户的会话列表
     */
    @GetMapping("/sessions")
    public Result<List<SessionVO>> sessions() {
        return Result.ok(qaService.sessions());
    }

    /**
     * 获取某个会话的完整对话内容
     */
    @GetMapping("/session/{sessionId}")
    public Result<List<QaRecord>> sessionMessages(@PathVariable String sessionId) {
        return Result.ok(qaService.sessionMessages(sessionId));
    }

    /**
     * 删除某个会话及其全部问答记录
     */
    @DeleteMapping("/session/{sessionId}")
    public Result<Void> deleteSession(@PathVariable String sessionId) {
        qaService.deleteSession(sessionId);
        return Result.ok();
    }

    /**
     * 手动重命名某个会话标题
     */
    @PutMapping("/session/{sessionId}/title")
    public Result<Void> renameSession(@PathVariable String sessionId,
                                      @Valid @RequestBody SessionTitleRequest request) {
        qaService.renameSession(sessionId, request.getTitle());
        return Result.ok();
    }

    /**
     * 问答反馈（点赞/点踩）
     */
    @PostMapping("/{id}/feedback")
    public Result<Void> feedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest request) {
        qaService.feedback(id, request.getType(), request.getReason());
        return Result.ok();
    }
}