import 'dotenv/config';
import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { processImages } from './services/vision-service.js';
import { initDatabase, getImageById } from './models/database.js';
import { matchImagesForPost } from './services/matching-service.js';
import { existsSync } from 'fs';

// Serve images from the data folder


const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;

// Initialize database on startup
initDatabase();

// Phase 2: Process all images
app.post('/images/process', async (req, res) => {
  try {
    const result = await processImages();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/images/file/:filename', (req, res) => {
  const imagePath = join(process.cwd(), 'data', 'images', req.params.filename);
  if (!existsSync(imagePath)) return res.status(404).json({ error: 'Image not found' });
  res.sendFile(imagePath);
});

// Phase 3: Match images to a blog post
app.get('/posts/:id/images', async (req, res) => {
  try {
    const result = await matchImagesForPost(req.params.id);
    if (!result) return res.status(404).json({ error: 'Post not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phase 4: Inspect a specific image
app.get('/images/:id', (req, res) => {
  const image = getImageById(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found' });
  res.json(image);
});

// Phase 4: Approve a suggestion
app.post('/suggestions/:imageId/approve', (req, res) => {
  res.json({ status: 'approved', image_id: req.params.imageId });
});

// Phase 4: Reject a suggestion
app.post('/suggestions/:imageId/reject', (req, res) => {
  res.json({ status: 'rejected', image_id: req.params.imageId, reason: req.body.reason || 'Manual rejection' });
});

// Get all posts
app.get('/api/posts', (req, res) => {
  const raw = readFileSync(join(process.cwd(), 'data', 'posts', 'posts.json'), 'utf-8');
  res.json(JSON.parse(raw));
});

// Create a post
app.post('/api/posts', (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  const posts = JSON.parse(readFileSync(join(process.cwd(), 'data', 'posts', 'posts.json'), 'utf-8'));
  const post = { id: `post-${Date.now()}`, title, body };
  posts.push(post);
  writeFileSync(join(process.cwd(), 'data', 'posts', 'posts.json'), JSON.stringify(posts, null, 2));
  res.status(201).json(post);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});