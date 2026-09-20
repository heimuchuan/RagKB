# 校园协作知识库系统

学生提交校园相关信息，管理员审核入库，并基于 RAG（检索增强生成）向学生提供智能问答的系统。

## 技术栈

| 层 | 技术 |
|-|-|
| 前端 | Vue 3 + Element Plus + Pinia + Vue Router + Vite |
| 后端 | Spring Boot 3 + MyBatis-Plus + MySQL 8 |
| 向量库 | Chroma |
| Embedding | BGE-M3（HuggingFace TEI） |
| 大模型 | Qwen / DeepSeek（OpenAI 兼容接口） |

## 目录结构

```
campus-knowledge-base/
├── backend/                  # Spring Boot 后端
│   ├── Dockerfile            # 多阶段构建（maven 打包 → jre 运行）
│   └── src/main/java/com/campus/knowledge/
│       ├── entity/ mapper/ service/ controller/   # 三层 + 实体
│       ├── config/ security/ exception/ common/   # 配置/鉴权/异常/通用返回
│       ├── dto/ vo/                                # 传输对象
│       └── rag/                                    # RAG 核心（分块/向量/检索/生成）
├── frontend/                 # Vue3 前端
│   └── src/
│       ├── views/student/    # 学生端 7 页
│       ├── views/admin/      # 管理员端 6 页
│       ├── api/              # 接口封装
│       ├── router/ store/ components/
├── docker-compose.yml        # 全栈编排（mysql/chroma/embedding/backend）
└── .env                      # 环境变量（敏感，已忽略提交）
```

## 快速开始

### 方式一：Docker 一键启动（推荐）

```bash
# 1. 编辑 .env，将 LLM_API_KEY 替换为真实 Key（必需，否则问答不可用）
# 2. 构建并启动全部服务
docker compose up -d --build

# 3. 查看运行状态
docker compose ps
```

启动后：
- 后端 API：http://localhost:8080
- 前端：需另启动（见下方「方式二」），或按需自行构建前端镜像

首次启动会联网拉取镜像并下载 BGE-M3 模型（约 4.5GB），耗时较长。

### 方式二：本地开发（不启用 Docker）

```bash
# 1. 初始化数据库
mysql -u root -p < backend/src/main/resources/db/schema.sql

# 2. 启动 RAG 依赖（向量库 + Embedding）
docker compose up -d chroma embedding

# 3. 后端（默认 8080，需在 application.yml 或环境变量中填数据库密码、LLM Key）
cd backend && mvn spring-boot:run

# 4. 前端（默认 http://localhost:5173，已代理 /api 到 8080）
cd frontend && npm install && npm run dev
```

## 环境变量

配置文件 `.env`（供 docker-compose 读取），主要项：

| 变量 | 说明 | 默认 |
|-|-|-|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | 随机生成 |
| `JWT_SECRET` | JWT 签名密钥 | 随机生成 |
| `LLM_API_URL` | 大模型接口地址 | DashScope 兼容接口 |
| `LLM_API_KEY` | 大模型 Key | 需替换 |
| `LLM_MODEL` | 模型名 | qwen-plus |

## 功能模块

**学生端**
- 登录 / 注册
- AI 智能问答（引用来源标注、点赞/点踩）
- 知识库浏览（分类筛选 + 关键词搜索）
- 提交信息（标题/分类/正文）
- 我的提交（状态：待审/通过/驳回）
- 我的纠错
- 个人中心（修改密码）

**管理员端**
- 管理员登录
- 审核管理（通过/驳回/批量审核）
- 条目管理（编辑/删除）
- 分类管理（增删改查）
- 纠错处理（采纳/拒绝）
- 数据统计

## 数据库

6 张表，见 `backend/src/main/resources/db/schema.sql`：

| 表 | 说明 |
|-|-|
| user | 用户（role: 0 学生 / 1 管理员） |
| category | 知识分类 |
| knowledge_entry | 知识条目（status: 0 待审 / 1 通过 / 2 驳回） |
| qa_record | 问答记录 |
| correction_feedback | 纠错反馈 |
| audit_log | 审核日志 |

## 管理员账号

系统默认无内置管理员。注册一个账号后，将 `user` 表中该账号的 `role` 改为 `1` 即可登录管理员端：

```sql
UPDATE user SET role = 1 WHERE username = '你的学号/用户名';
```

## RAG 流程

1. **入库**：管理员审核通过条目 → 文本清洗 → 分块（500 字，重叠 50）→ BGE-M3 向量化 → 存入 Chroma
2. **问答**：问题向量化 → Chroma 检索 top-5（相似度阈值 0.7）→ 拼接 Prompt → LLM 生成 → 标注引用来源

详细配置见 `backend/src/main/resources/application.yml` 的 `campus.rag` 与 `campus.llm`。