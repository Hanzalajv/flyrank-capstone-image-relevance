# Design Document — AI Image Matching Engine

## Problem
A blog owner has many images and needs to find the right one for each article.
Manual searching is slow. Wrong matches make the site look careless.

## Solution
A system that looks at each image, generates structured metadata, and matches
images to articles by meaning, not filenames.

## Data Models

### Image Metadata
- id: UUID
- filename: string
- subject: string
- category: string
- attributes: string[]
- caption: string
- confidence: number (0-1)
- created_at: timestamp

### Blog Post
- id: string
- title: string
- body: string

### Suggestion
- id: UUID
- post_id: string
- image_id: UUID
- score: number
- status: pending | approved | rejected

## API Surface

POST /images/process — Run vision processing on all images
GET  /posts/:id/images — Get ranked image suggestions for a post
POST /suggestions/:id/approve — Approve a suggestion
POST /suggestions/:id/reject — Reject a suggestion
GET  /suggestions/:id — Inspect why an image was selected

## Non-Goal
This system does not generate new images. It only matches existing images to posts.

## Strategy
1. Vision model describes each image
2. Embeddings turn descriptions and posts into vectors
3. Cosine similarity ranks images per post
4. Guard rejects matches below threshold or with category mismatch