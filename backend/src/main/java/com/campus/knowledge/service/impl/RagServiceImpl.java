package com.campus.knowledge.service.impl;

import com.campus.knowledge.common.BusinessException;
import com.campus.knowledge.service.RagService;
import com.campus.knowledge.vo.SourceRefVO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RAG 服务实现：文本分块 + BGE-M3 向量化 + Chroma 向量入库/检索/删除 + LLM 生成回答。
 * 依赖 Chroma、BGE-M3 Embedding、Qwen/DeepSeek 三个外部 HTTP 服务。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagServiceImpl implements RagService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${campus.rag.chunk-size:500}")
    private int chunkSize;

    @Value("${campus.rag.chunk-overlap:50}")
    private int chunkOverlap;

    @Value("${campus.rag.chroma-url:http://localhost:8000}")
    private String chromaUrl;

    @Value("${campus.rag.chroma-collection:campus_knowledge}")
    private String collectionName;

    @Value("${campus.rag.embedding-url:http://localhost:9997/v1/embeddings}")
    private String embeddingUrl;

    @Value("${campus.rag.top-k:5}")
    private int topK;

    @Value("${campus.rag.similarity-threshold:0.7}")
    private double similarityThreshold;

    @Value("${campus.llm.api-url:}")
    private String llmApiUrl;

    @Value("${campus.llm.api-key:}")
    private String llmApiKey;

    @Value("${campus.llm.model:qwen-plus}")
    private String llmModel;

    @Value("${campus.vision.api-url:}")
    private String visionApiUrl;

    @Value("${campus.vision.api-key:}")
    private String visionApiKey;

    @Value("${campus.vision.model:qwen-vl-plus}")
    private String visionModel;

    @Value("${campus.upload.dir:uploads}")
    private String uploadDir;

    /** 官方内容独立集合名后缀 */
    private static final String OFFICIAL_SUFFIX = "_official";
    /** 学生经验独立集合名后缀 */
    private static final String STUDENT_SUFFIX = "_student";

    /** 混合检索：稠密（向量相似度）权重 */
    private static final double DENSE_WEIGHT = 0.65;
    /** 混合检索：稀疏（词汇重叠）权重 */
    private static final double LEXICAL_WEIGHT = 0.35;
    /** 官方内容加权，使其在同等相似度下更靠前 */
    private static final double OFFICIAL_BOOST = 0.05;
    /** MMR 去重：相关性得分占比（越大越偏相关性，越小越偏多样性） */
    private static final double MMR_LAMBDA = 0.7;

    /** Chroma 集合 ID 缓存（key=集合名），避免每次请求都创建集合 */
    private final Map<String, String> collectionIdCache = new ConcurrentHashMap<>();

    @Override
    public List<String> chunkText(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return chunks;
        }
        // 文本清洗：去除 HTML 标签、压缩多余空白
        String cleaned = text.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
        if (cleaned.isEmpty()) {
            return chunks;
        }
        int len = cleaned.length();
        int step = Math.max(1, chunkSize - chunkOverlap);
        for (int start = 0; start < len; start += step) {
            int end = Math.min(start + chunkSize, len);
            chunks.add(cleaned.substring(start, end));
            if (end >= len) {
                break;
            }
        }
        return chunks;
    }

    @Override
    public List<double[]> embed(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return new ArrayList<>();
        }
        // OpenAI 兼容格式调用 BGE-M3：{"model":"bge-m3","input":[...]}
        Map<String, Object> body = new HashMap<>();
        body.put("model", "bge-m3");
        body.put("input", texts);
        try {
            JsonNode resp = postJson(embeddingUrl, body, null);
            JsonNode data = resp == null ? null : resp.get("data");
            List<double[]> vectors = new ArrayList<>();
            if (data != null && data.isArray()) {
                for (JsonNode item : data) {
                    JsonNode emb = item.path("embedding");
                    double[] vector = new double[emb.size()];
                    for (int i = 0; i < emb.size(); i++) {
                        vector[i] = emb.get(i).asDouble();
                    }
                    vectors.add(vector);
                }
            }
            if (vectors.isEmpty()) {
                throw new BusinessException("Embedding 服务返回空结果");
            }
            return vectors;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("调用 Embedding 服务失败 url={}", embeddingUrl, e);
            throw new BusinessException("AI 服务暂不可用");
        }
    }

    @Override
    public String store(Long entryId, String title, Long categoryId, Integer sourceType, List<String> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            log.warn("条目 {} 无内容可入库", entryId);
            return "";
        }
        String collectionId = getOrCreateCollectionId(collectionNameFor(sourceType));
        List<double[]> vectors = embed(chunks);
        if (vectors.size() != chunks.size()) {
            throw new BusinessException("向量数量与分块数量不一致");
        }
        // 每条向量的 id 使用 "entryId:index"，metadata 携带 entry_id/title/category（来源由所在集合决定）
        List<String> ids = new ArrayList<>();
        List<Map<String, Object>> metadatas = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            ids.add(entryId + ":" + i);
            Map<String, Object> meta = new HashMap<>();
            meta.put("entry_id", entryId);
            meta.put("title", title);
            meta.put("category", categoryId);
            metadatas.add(meta);
        }
        Map<String, Object> body = new HashMap<>();
        body.put("ids", ids);
        body.put("embeddings", vectors);
        body.put("metadatas", metadatas);
        body.put("documents", chunks);
        try {
            postJson(chromaUrl + "/api/v2/tenants/default_tenant/databases/default_database/collections/" + collectionId + "/add", body, null);
            log.info("条目 {} 已写入向量库，共 {} 条向量", entryId, chunks.size());
            return String.join(",", ids);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("写入向量库失败 entryId={}", entryId, e);
            throw new BusinessException("AI 服务暂不可用");
        }
    }

    @Override
    public List<SourceRefVO> search(String query) {
        if (query == null || query.isBlank()) {
            return new ArrayList<>();
        }
        double[] queryVector = embedSingle(query);
        // 多路召回：两个集合各自取 topK*2，扩大候选池再用 MMR 去重
        List<Candidate> candidates = new ArrayList<>();
        searchCollection(collectionName + OFFICIAL_SUFFIX, 1, query, queryVector, candidates);
        searchCollection(collectionName + STUDENT_SUFFIX, 0, query, queryVector, candidates);
        if (candidates.isEmpty()) {
            return new ArrayList<>();
        }
        candidates.sort((a, b) -> Double.compare(b.score, a.score));
        return mmrSelect(candidates, topK);
    }

    /** 在指定集合中检索，构造候选并入列表；sourceType 决定来源标注与官方加权 */
    private void searchCollection(String name, int sourceType, String query, double[] queryVector,
                                  List<Candidate> candidates) {
        String collectionId = getOrCreateCollectionId(name);
        Map<String, Object> body = new HashMap<>();
        body.put("query_embeddings", Collections.singletonList(queryVector));
        body.put("n_results", Math.max(topK * 2, topK));
        body.put("include", List.of("metadatas", "documents", "distances", "embeddings"));
        JsonNode resp;
        try {
            resp = postJson(chromaUrl + "/api/v2/tenants/default_tenant/databases/default_database/collections/" + collectionId + "/query", body, null);
        } catch (Exception e) {
            log.error("向量检索失败 collection={}", name, e);
            throw new BusinessException("AI 服务暂不可用");
        }
        if (resp == null) {
            return;
        }
        JsonNode docs = resp.path("documents").isArray() && resp.path("documents").size() > 0
                ? resp.path("documents").get(0) : null;
        JsonNode metas = resp.path("metadatas").isArray() && resp.path("metadatas").size() > 0
                ? resp.path("metadatas").get(0) : null;
        JsonNode dists = resp.path("distances").isArray() && resp.path("distances").size() > 0
                ? resp.path("distances").get(0) : null;
        JsonNode embs = resp.path("embeddings").isArray() && resp.path("embeddings").size() > 0
                ? resp.path("embeddings").get(0) : null;
        if (docs == null) {
            return;
        }
        for (int i = 0; i < docs.size(); i++) {
            String content = docs.get(i).asText(null);
            if (content == null || content.isBlank()) {
                continue;
            }
            double distance = dists == null ? 0.0 : dists.get(i).asDouble(0.0);
            // 集合使用 cosine 距离，相似度 ≈ 1 - distance
            double similarity = 1.0 - distance;
            if (similarity < similarityThreshold) {
                continue;
            }
            // 混合打分：稠密相似度 + 词汇重叠 + 官方加权
            double lexical = lexicalOverlap(query, content);
            double score = DENSE_WEIGHT * similarity + LEXICAL_WEIGHT * lexical
                    + (sourceType == 1 ? OFFICIAL_BOOST : 0.0);

            SourceRefVO vo = new SourceRefVO();
            if (metas != null && metas.get(i) != null) {
                JsonNode meta = metas.get(i);
                vo.setEntryId(meta.hasNonNull("entry_id") ? meta.get("entry_id").asLong() : null);
                vo.setTitle(meta.hasNonNull("title") ? meta.get("title").asText() : null);
            }
            vo.setSourceType(sourceType);
            vo.setContent(content);
            candidates.add(new Candidate(vo, score, parseEmbedding(embs == null ? null : embs.get(i))));
        }
    }

    /** MMR 贪心去重：平衡相关性与多样性，避免返回高度重复的片段 */
    private List<SourceRefVO> mmrSelect(List<Candidate> candidates, int k) {
        Set<Integer> used = new HashSet<>();
        List<Candidate> selected = new ArrayList<>();
        while (selected.size() < k && used.size() < candidates.size()) {
            int best = -1;
            double bestScore = -Double.MAX_VALUE;
            for (int i = 0; i < candidates.size(); i++) {
                if (used.contains(i)) {
                    continue;
                }
                Candidate c = candidates.get(i);
                double redundancy = 0.0;
                if (!selected.isEmpty() && c.embedding != null) {
                    for (Candidate s : selected) {
                        if (s.embedding != null) {
                            redundancy = Math.max(redundancy, cosine(c.embedding, s.embedding));
                        }
                    }
                }
                double mmr = MMR_LAMBDA * c.score - (1 - MMR_LAMBDA) * redundancy;
                if (mmr > bestScore) {
                    bestScore = mmr;
                    best = i;
                }
            }
            if (best < 0) {
                break;
            }
            used.add(best);
            selected.add(candidates.get(best));
        }
        List<SourceRefVO> result = new ArrayList<>();
        for (Candidate c : selected) {
            result.add(c.vo);
        }
        return result;
    }

    /** 两个向量余弦相似度（归一化到 [0,1]） */
    private double cosine(double[] a, double[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return 0.0;
        }
        int len = Math.min(a.length, b.length);
        double dot = 0.0;
        double na = 0.0;
        double nb = 0.0;
        for (int i = 0; i < len; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0.0 || nb == 0.0) {
            return 0.0;
        }
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    /** 基于字符 bigram 的词汇重叠覆盖率，衡量查询词在片段中被命中的程度 */
    private double lexicalOverlap(String query, String text) {
        if (query == null || text == null) {
            return 0.0;
        }
        String q = normalize(query);
        String t = normalize(text);
        if (q.isEmpty() || t.isEmpty()) {
            return 0.0;
        }
        Set<String> qg = bigrams(q);
        if (qg.isEmpty()) {
            return 0.0;
        }
        Set<String> tg = bigrams(t);
        int hit = 0;
        for (String g : qg) {
            if (tg.contains(g)) {
                hit++;
            }
        }
        return (double) hit / qg.size();
    }

    /** 相邻字符 bigram 集合（中文按单字相邻，英文按字母相邻） */
    private Set<String> bigrams(String s) {
        Set<String> set = new HashSet<>();
        for (int i = 0; i < s.length() - 1; i++) {
            set.add(s.substring(i, i + 2));
        }
        return set;
    }

    /** 归一化：去除非字母/数字（保留中文/英文/数字），转小写 */
    private String normalize(String s) {
        return s.replaceAll("[^\\p{L}\\p{N}]", "").toLowerCase();
    }

    /** 从 Jackson 节点解析 embedding 为 double[]，失败返回 null */
    private double[] parseEmbedding(JsonNode node) {
        if (node == null || !node.isArray()) {
            return null;
        }
        double[] arr = new double[node.size()];
        for (int i = 0; i < node.size(); i++) {
            arr[i] = node.get(i).asDouble(0.0);
        }
        return arr;
    }

    /** 检索候选：封装来源对象、融合得分与向量（用于 MMR 去重） */
    private static class Candidate {
        final SourceRefVO vo;
        final double score;
        final double[] embedding;

        Candidate(SourceRefVO vo, double score, double[] embedding) {
            this.vo = vo;
            this.score = score;
            this.embedding = embedding;
        }
    }

    @Override
    public String answer(String question, List<SourceRefVO> sources, List<Map<String, String>> history, String imageUrl) {
        boolean hasImage = imageUrl != null && !imageUrl.isBlank();
        if (!hasImage && (sources == null || sources.isEmpty())) {
            return "暂无相关信息";
        }

        // 无独立视觉配置时回退到文本模型（多模态会因模型不支持而失败）
        String apiUrl = hasImage && visionApiUrl != null && !visionApiUrl.isBlank() ? visionApiUrl : llmApiUrl;
        String apiKey = hasImage && visionApiKey != null && !visionApiKey.isBlank() ? visionApiKey : llmApiKey;
        String model = hasImage && visionApiUrl != null && !visionApiUrl.isBlank() ? visionModel : llmModel;

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", buildSystemMessage(hasImage)));
        if (history != null) {
            for (Map<String, String> h : history) {
                messages.add(new HashMap<>(h));
            }
        }
        // 视觉模型在公网无法访问本地 /files 地址，需将其转成 base64 data URL
        String resolvedImage = hasImage ? resolveImageToDataUrl(imageUrl) : imageUrl;
        messages.add(buildUserMessage(buildPrompt(question, sources), resolvedImage));
        body.put("messages", messages);
        body.put("temperature", hasImage ? 0.4 : 0.6);

        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + apiKey);
        try {
            JsonNode resp = postJson(apiUrl, body, headers);
            String content = resp == null ? null
                    : resp.path("choices").path(0).path("message").path("content").asText(null);
            if (content == null || content.isBlank()) {
                throw new BusinessException("大模型返回空内容");
            }
            return content;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("调用大模型失败 url={}", apiUrl, e);
            throw new BusinessException("AI 服务暂不可用");
        }
    }

    /** 构造 system 消息；带图片时补充多模态理解说明 */
    private String buildSystemMessage(boolean hasImage) {
        String base = "你是「校园知识助手」，一个熟悉校园规章制度、学习生活与设施服务的智能助手。"
                + "你的任务是根据下方参考资料，用友好、清晰、有条理的语言回答学生的疑问。\n"
                + "回答要求：\n"
                + "1. 先直接回答用户最关心的核心结论，不要绕弯子；\n"
                + "2. 再补充必要的细节（如时间、金额、条件、流程、联系方式等）；\n"
                + "3. 如果涉及多个相关条目，请自然地整合，而不是逐条罗列原文；\n"
                + "4. 全程只依据参考资料，资料没有的信息一律不要编造；如果资料确实无法回答，请明确说「根据现有资料暂时无法回答」；\n"
                + "5. 语气自然亲切，像一位耐心的学长学姐在解答；\n"
                + "6. 资料会标注来源（官方或同学经验），官方内容可信度更高，请优先采纳并在引用时注意区分。\n"
                + "另外，若对话存在历史，请结合上下文理解当前问题时可能出现的指代（如「它」「那个」），回答时保持上下文连贯。";
        if (hasImage) {
            base += "\n本次用户附带了一张图片，请仔细观察图片内容，结合图片与参考资料共同回答；如果图片与问题相关但资料缺失，可基于图片内容作答。";
        }
        return base;
    }

    /** 构造当前用户消息；带图片时使用 OpenAI 兼容的多模态 content 结构 */
    private Map<String, Object> buildUserMessage(String text, String imageUrl) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("role", "user");
        if (imageUrl == null || imageUrl.isBlank()) {
            msg.put("content", text);
        } else {
            List<Map<String, Object>> content = new ArrayList<>();
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("type", "text");
            textPart.put("text", text);
            content.add(textPart);
            Map<String, Object> imagePart = new HashMap<>();
            imagePart.put("type", "image_url");
            Map<String, Object> imageUrlObj = new HashMap<>();
            imageUrlObj.put("url", imageUrl);
            imagePart.put("image_url", imageUrlObj);
            content.add(imagePart);
            msg.put("content", content);
        }
        return msg;
    }

    /**
     * 将本地文件相对地址（/files/{name}）读成 base64 data URL，供视觉模型直接识别。
     * 非本地路径或读取失败时原样返回。
     */
    private String resolveImageToDataUrl(String imageUrl) {
        try {
            String name = imageUrl.startsWith("/files/") ? imageUrl.substring("/files/".length()) : imageUrl;
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path target = root.resolve(name).normalize();
            if (!target.startsWith(root) || !Files.exists(target)) {
                return imageUrl;
            }
            byte[] bytes = Files.readAllBytes(target);
            String mime = contentTypeOf(target.getFileName() == null ? "" : target.getFileName().toString());
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("图片转 base64 失败，回退使用原始地址：{}", e.getMessage());
            return imageUrl;
        }
    }

    /** 按扩展名推断 MIME，用于拼接 data URL */
    private String contentTypeOf(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        return "image/png";
    }

    @Override
    public String summarizeTitle(String question) {
        if (question == null || question.isBlank()) {
            return null;
        }
        String systemMessage = "你是一名对话标题助手。请根据用户的问题，理解其核心诉求，提炼出一个不超过12个字的简洁标题。"
                + "直接输出标题本身，不要加引号、标点、序号或任何额外说明。";
        Map<String, Object> body = new HashMap<>();
        body.put("model", llmModel);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemMessage));
        messages.add(Map.of("role", "user", "content", "用户问题：" + question));
        body.put("messages", messages);
        body.put("temperature", 0.3);

        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + llmApiKey);
        try {
            JsonNode resp = postJson(llmApiUrl, body, headers);
            String title = resp == null ? null
                    : resp.path("choices").path(0).path("message").path("content").asText(null);
            if (title == null || title.isBlank()) {
                return null;
            }
            // 清理标题中的引号、书名号、换行等噪音，并限制长度
            title = title.replaceAll("[\\r\\n\"'「」『』《》]", "").trim();
            if (title.length() > 30) {
                title = title.substring(0, 30);
            }
            return title.isBlank() ? null : title;
        } catch (Exception e) {
            log.warn("生成会话标题失败，回退使用问题原文：{}", e.getMessage());
            return null;
        }
    }

    @Override
    public void removeByEntryId(Long entryId) {
        if (entryId == null) {
            return;
        }
        // 官方与学生两个集合都尝试删除（清理操作，失败仅告警不阻塞主流程）
        for (String name : new String[]{collectionName + OFFICIAL_SUFFIX, collectionName + STUDENT_SUFFIX}) {
            try {
                String collectionId = getOrCreateCollectionId(name);
                Map<String, Object> where = new HashMap<>();
                where.put("entry_id", entryId);
                Map<String, Object> body = new HashMap<>();
                body.put("where", where);
                postJson(chromaUrl + "/api/v2/tenants/default_tenant/databases/default_database/collections/" + collectionId + "/delete", body, null);
                log.info("已删除条目 {} 在集合 {} 中的向量记录", entryId, name);
            } catch (Exception e) {
                log.warn("删除条目 {} 在集合 {} 中的向量记录失败：{}", entryId, name, e.getMessage());
            }
        }
    }

    /**
     * 拼接 Prompt（需求文档 6.3）：系统提示为条目检索预设，参考资料 + 用户问题作为用户消息
     */
    private String buildPrompt(String question, List<SourceRefVO> sources) {
        if (sources == null || sources.isEmpty()) {
            return "用户的问题：" + question + "\n\n请结合用户提供的图片（如有）作答，不要编造。";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("以下是知识库中检索到的参考资料（每条标注了编号），请优先依据这些内容回答：\n");
        for (int i = 0; i < sources.size(); i++) {
            SourceRefVO s = sources.get(i);
            String title = s.getTitle() == null ? "" : s.getTitle();
            String content = s.getContent() == null ? "" : s.getContent();
            String sourceLabel = (s.getSourceType() != null && s.getSourceType() == 1) ? "官方" : "同学经验";
            sb.append("\n【资料").append(i + 1).append("】《").append(title).append("》（来源：").append(sourceLabel).append("）\n").append(content).append("\n");
        }
        sb.append("\n用户的问题：").append(question).append("\n\n");
        sb.append("请在回答末尾单独另起一行，标注引用了哪些资料，格式为「参考资料：[1][2]」。");
        return sb.toString();
    }

    /** 单条文本向量化 */
    private double[] embedSingle(String text) {
        List<double[]> vectors = embed(Collections.singletonList(text));
        return vectors.get(0);
    }

    /** 根据来源类型得到集合名：官方=_official，学生=_student */
    private String collectionNameFor(Integer sourceType) {
        return (sourceType != null && sourceType == 1)
                ? collectionName + OFFICIAL_SUFFIX
                : collectionName + STUDENT_SUFFIX;
    }

    /** 获取（或创建）指定名称的 Chroma 集合 ID，带缓存 */
    private String getOrCreateCollectionId(String name) {
        String cached = collectionIdCache.get(name);
        if (cached != null) {
            return cached;
        }
        synchronized (this) {
            cached = collectionIdCache.get(name);
            if (cached != null) {
                return cached;
            }
            String id = findCollectionId(name);
            if (id == null) {
                id = createCollection(name);
            }
            collectionIdCache.put(name, id);
            return id;
        }
    }

    /** 按集合名查询 ID，不存在或接口异常时返回 null */
    private String findCollectionId(String name) {
        try {
            String url = chromaUrl + "/api/v2/tenants/default_tenant/databases/default_database/collections/" + name;
            ResponseEntity<String> res = restTemplate.getForEntity(url, String.class);
            JsonNode node = objectMapper.readTree(res.getBody());
            if (node != null) {
                String id = node.path("id").asText(null);
                if (id != null && !id.isBlank()) {
                    return id;
                }
            }
        } catch (HttpClientErrorException.NotFound e) {
            log.info("集合 {} 不存在，将自动创建", name);
        } catch (Exception e) {
            log.warn("按名称查询集合失败，将尝试创建：{}", e.getMessage());
        }
        return null;
    }

    /** 创建指定名称的集合（指定 cosine 距离，便于用 1-distance 计算相似度） */
    private String createCollection(String name) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("hnsw:space", "cosine");
        body.put("metadata", metadata);
        try {
            JsonNode resp = postJson(chromaUrl + "/api/v2/tenants/default_tenant/databases/default_database/collections", body, null);
            String id = resp == null ? null : resp.path("id").asText(null);
            if (id == null || id.isBlank()) {
                throw new BusinessException("创建向量集合失败");
            }
            log.info("已创建 Chroma 集合 {}，id={}", name, id);
            return id;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("创建 Chroma 集合失败 url={}", chromaUrl, e);
            throw new BusinessException("AI 服务暂不可用");
        }
    }

    /** 发送 POST JSON 请求并解析响应为 JsonNode */
    private JsonNode postJson(String url, Object body, Map<String, String> headers) throws Exception {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        if (headers != null) {
            headers.forEach(httpHeaders::set);
        }
        HttpEntity<Object> entity = new HttpEntity<>(body, httpHeaders);
        ResponseEntity<String> res = restTemplate.postForEntity(url, entity, String.class);
        String respBody = res.getBody();
        if (respBody == null || respBody.isBlank()) {
            return null;
        }
        return objectMapper.readTree(respBody);
    }
}