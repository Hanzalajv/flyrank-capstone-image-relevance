import 'dotenv/config';
import express from 'express';
import { processImages } from './services/vision-service.js';
import { initDatabase } from './models/database.js';

const app = express();
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});