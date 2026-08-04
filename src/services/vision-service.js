import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { insertImage } from '../models/database.js';

const IMAGES_DIR = join(process.cwd(), 'data', 'images');
const METADATA_DIR = join(process.cwd(), 'data', 'metadata');

export async function processImages() {
  const imageFiles = readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  const metadataFiles = readdirSync(METADATA_DIR).filter(f => f.endsWith('.json'));
  
  const results = [];

  for (const file of imageFiles) {
    const baseName = file.replace(/\.(jpg|png)$/, '');
    const metadataPath = join(METADATA_DIR, `${baseName}.json`);

    if (!metadataFiles.includes(`${baseName}.json`)) {
      console.log(`  Skipping ${file}: no metadata file found`);
      results.push({ file, status: 'skipped', error: 'No metadata file' });
      continue;
    }

    try {
      const raw = readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(raw);

      // Validate required fields
      if (!metadata.subject || !metadata.category || !metadata.caption) {
        throw new Error('Missing required fields in metadata');
      }

      // Flag low confidence
      const isLowConfidence = (metadata.confidence || 0) < 0.7;

      const image = {
        id: uuidv4(),
        filename: file,
        subject: metadata.subject,
        category: metadata.category,
        subcategory: metadata.subcategory || '',
        attributes: metadata.attributes || [],
        setting: metadata.setting || '',
        action: metadata.action || '',
        colors: metadata.colors || [],
        mood: metadata.mood || '',
        composition: metadata.composition || '',
        caption: metadata.caption,
        confidence: metadata.confidence || 0,
        flagged: isLowConfidence
      };

      insertImage(image);

      results.push({
        file,
        status: isLowConfidence ? 'flagged_low_confidence' : 'processed',
        subject: metadata.subject,
        category: metadata.category,
        subcategory: metadata.subcategory,
        setting: metadata.setting,
        action: metadata.action,
        mood: metadata.mood
      });

      console.log(`  ${file}: ${metadata.subcategory || metadata.category}, ${metadata.setting}, ${metadata.action}, confidence: ${metadata.confidence}${isLowConfidence ? ' [FLAGGED]' : ''}`);

    } catch (err) {
      console.error(`  Failed ${file}: ${err.message}`);
      results.push({ file, status: 'failed', error: err.message });
    }
  }

  const flagged = results.filter(r => r.status === 'flagged_low_confidence').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const success = results.filter(r => r.status === 'processed').length;

  return {
    summary: { total: imageFiles.length, success, flagged, failed, skipped },
    results
  };
}