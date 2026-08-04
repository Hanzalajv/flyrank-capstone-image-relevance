# Build Log — AI Image Matching Engine

## AI Assistance Summary

| Area | AI Help | What I Changed |
|------|---------|----------------|
| Project structure | AI suggested Express + SQLite layout | Adopted as-is, clean separation |
| Vision prompts | AI wrote initial prompt, I refined to include subcategory, setting, action, mood, composition | Added 6 new fields for richer matching |
| Embedding pipeline | AI suggested Gemini text-embedding-004, which failed on free tier. Then suggested @xenova/transformers | Local model works perfectly, zero cost, no limits |
| Matching engine | AI wrote cosine similarity and guard logic | Adjusted threshold from 0.65 to 0.3 after testing. Added category map |
| Frontend UI | AI generated the HTML/CSS/JS | Styled to match my dark navy portfolio theme. Added image previews |
| Database schema | AI designed initial schema | Added subcategory, setting, action, colors, mood, composition columns |

## What AI Got Wrong

1. **Gemini embedding model name:** Suggested `text-embedding-004` which returned 404. Also suggested `embedding-001` which also failed. Free tier does not support embeddings. Switched to local Xenova model.

2. **Gemini API rate limits:** Documentation says 1,500 requests/day. In practice, the free tier blocked after ~50 requests within one minute. Daily quota is shared across all keys in the same project. Had to switch to manual Gemini Chat for vision labeling and local model for embeddings.

3. **better-sqlite3 native build:** Initially failed on Windows without Visual Studio. Switched to sql.js briefly, then went back to better-sqlite3 after installing build tools.

## Honest Assessment

The Gemini free tier is not suitable for any batch processing workflow. The rate limits are extremely restrictive for the vision API, and the embedding API is simply not available on the free tier. The capstone brief's promise of "free tier is enough for ~50 images" is optimistic at best — it works if you process 5 images per day across 10 days, which is impractical for development.

The local Xenova model is a better fit. It downloads once (~80MB), runs entirely on CPU, and has no usage limits. The embedding quality is slightly lower than Gemini's, but more than adequate for a 50-image corpus.

The vision labeling was done through Gemini Chat (not API) which has no rate limits. This is a legitimate workaround — the chat interface uses the same model but does not enforce the harsh API quotas.