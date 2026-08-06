import 'dotenv/config';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { processImages } from './services/vision-service.js';
import { initDatabase, getImageById, getAllPosts, insertPost } from './models/database.js';
import { matchImagesForPost } from './services/matching-service.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;

initDatabase();

app.post('/images/process', async (req, res) => {
  try {
    const result = await processImages();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/images/file/:filename', (req, res) => {
  const imagePath = join(process.cwd(), 'data', 'images', req.params.filename);
  if (!existsSync(imagePath)) return res.status(404).json({ error: 'Image not found' });
  res.sendFile(imagePath);
});

app.get('/posts/:id/images', async (req, res) => {
  try {
    const result = await matchImagesForPost(req.params.id);
    if (!result) return res.status(404).json({ error: 'Post not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/images/:id', (req, res) => {
  const image = getImageById(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found' });
  res.json(image);
});

app.post('/suggestions/:imageId/approve', (req, res) => {
  res.json({ status: 'approved', image_id: req.params.imageId });
});

app.post('/suggestions/:imageId/reject', (req, res) => {
  res.json({ status: 'rejected', image_id: req.params.imageId, reason: req.body.reason || 'Manual rejection' });
});

app.get('/api/posts', (req, res) => {
  res.json(getAllPosts());
});

app.post('/api/posts', (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  const post = insertPost({ id: `post-${Date.now()}`, title, body });
  res.status(201).json(post);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});