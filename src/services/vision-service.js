import { GoogleGenerativeAI } from '@google/generative-ai';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { insertImage, getAllImages } from '../models/database.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const IMAGES_DIR = join(process.cwd(), 'data', 'images');

// Schema for what we want Gemini to return
const schema = {
  subject: 'string (main subject of the image)',
  category: 'string (animal category: fox, wolf, dog, bear, deer)',
  attributes: 'array of strings (colors, setting, mood)',
  caption: 'string (one sentence describing the image)',
  confidence: 'number between 0 and 1'
};

export async function processImages() {
  const files = readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  
  const results = [];
  const costs = [];

  for (const file of files) {
    console.log(`Processing: ${file}`);
    
    try {
      const imagePath = join(IMAGES_DIR, file);
      const imageData = readFileSync(imagePath);
      const base64Image = imageData.toString('base64');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `Describe this image. Return ONLY valid JSON with these fields:
      {
        "subject": "main subject",
        "category": "fox, wolf, dog, bear, or deer",
        "attributes": ["color1", "setting", "mood"],
        "caption": "one sentence description",
        "confidence": 0.92
      }`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
      ]);

      const text = result.response.text();
      
      // Extract JSON from response (Gemini sometimes wraps it in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const metadata = JSON.parse(jsonMatch[0]);
      
      // Validate schema
      if (!metadata.subject || !metadata.category || !metadata.caption) {
        throw new Error('Missing required fields in vision response');
      }

      // Flag low confidence
      const isLowConfidence = metadata.confidence < 0.7;
      
      const image = {
        id: uuidv4(),
        filename: file,
        subject: metadata.subject,
        category: metadata.category,
        attributes: metadata.attributes || [],
        caption: metadata.caption,
        confidence: metadata.confidence,
        flagged: isLowConfidence
      };

      insertImage(image);
      
      // Track cost (free tier: $0, but we log it)
      const usage = result.response.usageMetadata || {};
      costs.push({
        file,
        promptTokens: usage.promptTokens || 0,
        totalTokens: usage.totalTokens || 0
      });

      results.push({
        file,
        status: isLowConfidence ? 'flagged_low_confidence' : 'processed',
        metadata
      });

      console.log(`  ${file}: ${image.category}, confidence: ${image.confidence}${isLowConfidence ? ' [FLAGGED]' : ''}`);

      // Rate limit: wait 1 second between calls
      await sleep(1000);

    } catch (err) {
      console.error(`  Failed ${file}: ${err.message}`);
      results.push({ file, status: 'failed', error: err.message });
    }
  }

  const flagged = results.filter(r => r.status === 'flagged_low_confidence').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const success = results.filter(r => r.status === 'processed').length;

  return {
    summary: { total: files.length, success, flagged, failed },
    costs,
    results
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}