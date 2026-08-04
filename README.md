# FlyRank Capstone — AI Image Matching Engine

Given a set of wildlife images and blog posts, this system understands what is in each image,
tags it automatically, and matches the right image to the right article.

A fox post gets the fox photo. A wolf is rejected. If no image fits, the system says so.

## Architecture

Images → Vision Model (Gemini Chat) → Metadata JSON → Database
Blog Posts → Local Embedding Model (Xenova) → Vectors
Query → Compare Vectors → Rank by Similarity → Mismatch Guard → Best Match


## Setup

1. Clone the repo
2. `npm install`
3. Place wildlife images in `data/images/`
4. Create matching metadata JSON files in `data/metadata/` (use Gemini Chat with the prompt in `src/services/vision-service.js`)
5. `npm run dev`
6. Open http://localhost:3000

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /images/process | No | Process all images from metadata |
| GET | /health | No | Health check |
| GET | /posts/:id/images | No | Rank images for a post |
| GET | /images/:id | No | Get image metadata |
| GET | /images/file/:filename | No | Serve image file |
| POST | /suggestions/:id/approve | No | Approve a match |
| POST | /suggestions/:id/reject | No | Reject a match |
| GET | /api/posts | No | List all posts |
| POST | /api/posts | No | Create a post |

## Limitations

- Vision labeling requires manual Gemini Chat usage (API free tier rate limits are too restrictive)
- Embeddings use a local model (~80MB download on first run, runs on CPU)
- Image corpus is small (5 images, 5 posts) but demonstrates the full pipeline
- No authentication — this is a prototype, not a production system
- Matching quality depends on metadata richness — better prompts produce better matches

## Tech Stack

- Express.js (backend)
- SQLite via better-sqlite3 (database)
- Xenova Transformers (local embeddings)
- Gemini Chat (vision labeling, manual)
- Vanilla HTML/CSS/JS (admin UI)

