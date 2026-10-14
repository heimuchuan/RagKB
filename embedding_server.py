# -*- coding: utf-8 -*-
"""BGE-M3 Embedding 服务（OpenAI 兼容 /v1/embeddings）

模型使用 ModelScope 下载到本地的 BAAI/bge-m3（避免联网）。
"""
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="BGE-M3 Embedding Service")

# 加载本地模型（CPU 推理）
MODEL_PATH = r"D:\自己写项目\RagKB\models\models\BAAI--bge-m3\snapshots\master"
model = SentenceTransformer(MODEL_PATH)


class EmbedRequest(BaseModel):
    model: str = "bge-m3"
    input: object  # 支持单个字符串或字符串列表


@app.post("/v1/embeddings")
def embeddings(req: EmbedRequest):
    texts = req.input if isinstance(req.input, list) else [req.input]
    vectors = model.encode(
        texts,
        normalize_embeddings=True,  # 归一化，使 cosine 距离即点积距离
        show_progress_bar=False,
    ).tolist()

    data = [
        {"object": "embedding", "index": i, "embedding": vec}
        for i, vec in enumerate(vectors)
    ]
    return {
        "object": "list",
        "data": data,
        "model": req.model,
        "usage": {"prompt_tokens": sum(len(t) for t in texts), "total_tokens": sum(len(t) for t in texts)},
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=9997)