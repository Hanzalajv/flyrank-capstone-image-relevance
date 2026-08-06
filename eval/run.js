import { matchImagesForPost } from '../src/services/matching-service.js';
import { initDatabase } from '../src/models/database.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

initDatabase();

const labeledData = [
  { postId: 'post-1', expectedCategory: 'fox', label: 'Fox post should match fox' },
  { postId: 'post-2', expectedCategory: 'wolf', label: 'Wolf post should match wolf' },
  { postId: 'post-3', expectedCategory: 'dog', label: 'Dog post should match dog' },
  { postId: 'post-4', expectedCategory: 'bear', label: 'Bear post should match bear' },
  { postId: 'post-5', expectedCategory: 'deer', label: 'Deer post should match deer' },
];

const results = [];
let correct = 0;

for (const item of labeledData) {
  const result = await matchImagesForPost(item.postId);
  const topMatch = result.best_match;
  const isCorrect = topMatch && topMatch.category === item.expectedCategory;
  if (isCorrect) correct++;
  
  results.push({
    post: item.label,
    expected: item.expectedCategory,
    actual: topMatch?.category || 'none',
    passed: isCorrect,
    score: topMatch?.score || 0
  });
}

const precision = ((correct / labeledData.length) * 100).toFixed(1);

console.log('\n=== Evaluation Results ===\n');
results.forEach(r => {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} | ${r.post}`);
  console.log(`       Expected: ${r.expected} | Got: ${r.actual} | Score: ${r.score}\n`);
});
console.log(`Top-1 Precision: ${precision}% (${correct}/${labeledData.length})`);

// Update README with precision
const readmePath = join(process.cwd(), 'README.md');
let readme = readFileSync(readmePath, 'utf-8');
const precisionLine = `**Top-1 Precision:** ${precision}%`;
if (readme.includes('Top-1 Precision')) {
  readme = readme.replace(/\*\*Top-1 Precision:\*\*.*/, precisionLine);
} else {
  readme += `\n\n${precisionLine}\n`;
}
writeFileSync(readmePath, readme);
console.log(`\nUpdated README.md with precision score.`);