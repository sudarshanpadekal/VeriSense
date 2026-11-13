from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline import fetch_bluesky_posts, run_pipeline

app = FastAPI(title="VeriSense MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class HandleRequest(BaseModel):
    handle: str
    limit: int = 5


class ManualPostsRequest(BaseModel):
    posts: list[str]


@app.get("/health")
def health():
    return {"status": "ok", "project": "VeriSense"}


@app.post("/api/scan/bluesky")
async def scan_bluesky(req: HandleRequest):
    try:
        posts = await fetch_bluesky_posts(req.handle, req.limit)
        if not posts:
            raise HTTPException(status_code=404, detail="No public text posts found for this handle.")
        return await run_pipeline(posts)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scan/manual")
async def scan_manual(req: ManualPostsRequest):
    formatted = [{"text": p.strip(), "author": "Demo Feed"} for p in req.posts if p.strip()]
    if not formatted:
        raise HTTPException(status_code=400, detail="Provide at least one non-empty post.")
    return await run_pipeline(formatted)