-- 校园协作知识库系统 建表脚本
-- MySQL 8.0+ / utf8mb4
-- 执行方式：mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS campus_knowledge
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE campus_knowledge;

-- ==========================================================
-- 1. 用户表
-- ==========================================================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username`   VARCHAR(50)  NOT NULL                COMMENT '学号/工号',
  `password`   VARCHAR(100) NOT NULL                COMMENT '密码（BCrypt 加密）',
  `real_name`  VARCHAR(50)  NOT NULL                COMMENT '真实姓名',
  `role`       TINYINT      NOT NULL DEFAULT 0      COMMENT '角色：0=学生，1=管理员，2=信任账号',
  `email`      VARCHAR(100)          DEFAULT NULL   COMMENT '邮箱',
  `status`     TINYINT      NOT NULL DEFAULT 0      COMMENT '状态：0=正常，1=禁用',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ==========================================================
-- 2. 分类表
-- ==========================================================
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name`        VARCHAR(50)  NOT NULL                COMMENT '分类名称',
  `description` VARCHAR(200)          DEFAULT NULL   COMMENT '分类描述',
  `sort_order`  INT          NOT NULL DEFAULT 0      COMMENT '排序权重',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

-- ==========================================================
-- 3. 知识条目表
-- ==========================================================
DROP TABLE IF EXISTS `knowledge_entry`;
CREATE TABLE `knowledge_entry` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title`         VARCHAR(200) NOT NULL                COMMENT '标题',
  `content`       TEXT         NOT NULL                COMMENT '正文内容',
  `attachment`    JSON                  DEFAULT NULL   COMMENT '附件列表（JSON：name/url/type/size）',
  `category_id`   BIGINT                DEFAULT NULL   COMMENT '所属分类ID（→ category.id）',
  `source_type`   TINYINT      NOT NULL DEFAULT 0      COMMENT '来源：0=学生经验，1=官方',
  `submitter_id`  BIGINT                DEFAULT NULL   COMMENT '提交者ID（→ user.id）',
  `status`        TINYINT      NOT NULL DEFAULT 0      COMMENT '状态：0=待审核，1=已通过，2=已驳回',
  `reject_reason` TEXT                  DEFAULT NULL   COMMENT '驳回原因',
  `vector_id`     VARCHAR(100)          DEFAULT NULL   COMMENT '向量库中的ID',
  `view_count`    INT          NOT NULL DEFAULT 0      COMMENT '浏览次数',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  `approved_at`   DATETIME              DEFAULT NULL   COMMENT '审核通过时间',
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_submitter_id` (`submitter_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识条目表';

-- ==========================================================
-- 4. 问答记录表
-- ==========================================================
DROP TABLE IF EXISTS `qa_record`;
CREATE TABLE `qa_record` (
  `id`               BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `question`         TEXT     NOT NULL                COMMENT '用户问题',
  `image_url`        VARCHAR(512)       DEFAULT NULL  COMMENT '提问图片地址',
  `answer`           TEXT     NOT NULL                COMMENT 'AI 回答',
  `sources`          JSON              DEFAULT NULL   COMMENT '引用来源列表',
  `user_id`          BIGINT            DEFAULT NULL   COMMENT '提问者ID（→ user.id）',
  `session_id`       VARCHAR(64)       DEFAULT NULL   COMMENT '会话ID（多轮对话）',
  `feedback`         TINYINT  NOT NULL DEFAULT 0      COMMENT '反馈：0=无，1=点赞，2=点踩',
  `feedback_content` TEXT              DEFAULT NULL   COMMENT '点踩时填写的原因',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提问时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问答记录表';

-- ==========================================================
-- 5. 纠错反馈表
-- ==========================================================
DROP TABLE IF EXISTS `correction_feedback`;
CREATE TABLE `correction_feedback` (
  `id`                BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `entry_id`          BIGINT            DEFAULT NULL   COMMENT '关联的知识条目ID（→ knowledge_entry.id）',
  `reporter_id`       BIGINT            DEFAULT NULL   COMMENT '报告者ID（→ user.id）',
  `original_content`  TEXT              DEFAULT NULL   COMMENT '原文内容',
  `suggested_content` TEXT              DEFAULT NULL   COMMENT '建议修正内容',
  `reason`            TEXT              DEFAULT NULL   COMMENT '纠错原因',
  `status`            TINYINT  NOT NULL DEFAULT 0      COMMENT '状态：0=待处理，1=已采纳，2=已拒绝',
  `admin_reply`       TEXT              DEFAULT NULL   COMMENT '管理员回复',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  `handled_at`        DATETIME          DEFAULT NULL   COMMENT '处理时间',
  PRIMARY KEY (`id`),
  KEY `idx_entry_id` (`entry_id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='纠错反馈表';

-- ==========================================================
-- 6. 审核日志表
-- ==========================================================
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id`         BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `entry_id`   BIGINT            DEFAULT NULL   COMMENT '关联的知识条目ID（→ knowledge_entry.id）',
  `admin_id`   BIGINT            DEFAULT NULL   COMMENT '审核人ID（→ user.id）',
  `action`     TINYINT  NOT NULL                COMMENT '操作：1=通过，2=驳回',
  `comment`    TEXT              DEFAULT NULL   COMMENT '审核意见',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_entry_id` (`entry_id`),
  KEY `idx_admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核日志表';