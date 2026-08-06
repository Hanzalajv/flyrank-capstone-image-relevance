

import { readFileSync } from 'fs';
import { join } from 'path';
import { getAllImages, getAllPosts, getPostById } from '../models/database.js';
import { getEmbedding, cosineSimilarity } from './embedding-service.js';



const POSTS_FILE = join(process.cwd(), 'data', 'posts', 'posts.json');

function getPosts() {
  const raw = readFileSync(POSTS_FILE, 'utf-8');
  return JSON.parse(raw);
}

export async function matchImagesForPost(postId) {
  const post = getPostById(postId);
  if (!post) return null;

  const images = getAllImages();
  if (images.length === 0) return { post, matches: [], reason: 'No images in database' };

  const postText = `${post.title}. ${post.body}`;
  const postEmbedding = await getEmbedding(postText);

  const scored = [];

  for (const image of images) {
    const imageText = `${image.caption} ${image.subject} ${image.attributes.join(' ')} ${image.setting} ${image.action}`;
    const imageEmbedding = await getEmbedding(imageText);
    const score = cosineSimilarity(postEmbedding, imageEmbedding);
    
    scored.push({ image, score: Math.round(score * 1000) / 1000 });
  }

  scored.sort((a, b) => b.score - a.score);

  const results = scored.map(item => {
    const guard = evaluateGuard(post, item.image, item.score);
    return {
      image_id: item.image.id,
      filename: item.image.filename,
      subject: item.image.subject,
      category: item.image.category,
      subcategory: item.image.subcategory,
      caption: item.image.caption,
      setting: item.image.setting,
      action: item.image.action,
      mood: item.image.mood,
      score: item.score,
      passed: guard.passed,
      reason: guard.reason,
    };
  });

  const bestMatch = results.find(r => r.passed);
  const noMatchReason = bestMatch ? null : 'No image passed the mismatch guard.';

  return {
    post: { id: post.id, title: post.title },
    best_match: bestMatch || null,
    no_match_reason: noMatchReason,
    all_results: results,
  };
}

function evaluateGuard(post, image, score) {
  if (score < 0.3) {
    return { passed: false, reason: `Similarity score too low (${score}). Threshold is 0.3.` };
  }

  const postTitle = post.title.toLowerCase();
  const imageCategory = (image.category || '').toLowerCase();

  const categoryMap = {
    fox: ['fox'],
    wolf: ['wolf'],
    dog: ['dog'],
    bear: ['bear'],
    deer: ['deer'],
  };

  let expectedCategory = null;
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => postTitle.includes(k))) {
      expectedCategory = cat;
      break;
    }
  }

  if (expectedCategory && imageCategory !== expectedCategory) {
    return {
      passed: false,
      reason: `Category mismatch: post about '${expectedCategory}' but image is '${imageCategory}' (${image.subject}).`,
    };
  }

  return { passed: true, reason: 'Match passed.' };
}