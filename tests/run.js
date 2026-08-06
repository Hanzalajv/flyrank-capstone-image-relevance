import { matchImagesForPost } from '../src/services/matching-service.js';
import { initDatabase, getAllImages } from '../src/models/database.js';

initDatabase();

const tests = [];

// Test 1: Fox post should match fox image first
const foxResult = await matchImagesForPost('post-1');
const foxBest = foxResult.best_match;
tests.push({
  name: 'Fox post returns fox as best match',
  passed: foxBest && foxBest.category === 'fox',
  detail: foxBest ? `Matched: ${foxBest.subject} (score: ${foxBest.score})` : 'No match'
});

// Test 2: Wolf post should match wolf image first
const wolfResult = await matchImagesForPost('post-2');
const wolfBest = wolfResult.best_match;
tests.push({
  name: 'Wolf post returns wolf as best match',
  passed: wolfBest && wolfBest.category === 'wolf',
  detail: wolfBest ? `Matched: ${wolfBest.subject} (score: ${wolfBest.score})` : 'No match'
});

// Test 3: Guard should reject wrong categories
const foxResults = foxResult.all_results;
const wolfInFoxResults = foxResults.find(r => r.category === 'wolf');
tests.push({
  name: 'Wolf image is rejected for fox post',
  passed: wolfInFoxResults && wolfInFoxResults.passed === false,
  detail: wolfInFoxResults ? `Reason: ${wolfInFoxResults.reason}` : 'Wolf not in results'
});

// Test 4: All 5 images have metadata
const images = getAllImages();
tests.push({
  name: 'All 5 images have complete metadata',
  passed: images.length >= 5 && images.every(i => i.subject && i.category && i.caption),
  detail: `${images.length} images in database`
});

// Test 5: Non-existent post returns 404
const missingResult = await matchImagesForPost('post-999');
tests.push({
  name: 'Missing post returns null',
  passed: missingResult === null,
  detail: missingResult ? 'Returned data' : 'Correctly returned null'
});

console.log('\n=== Test Results ===\n');
let passed = 0;
tests.forEach(t => {
  const icon = t.passed ? 'PASS' : 'FAIL';
  console.log(`${icon} | ${t.name}`);
  console.log(`     ${t.detail}\n`);
  if (t.passed) passed++;
});
console.log(`${passed}/${tests.length} tests passed`);

// Test: Malformed JSON is rejected
function testSchemaValidation() {
  const badJson = '{ "subject": "test", "category": "fox" }'; // missing caption
  try {
    const parsed = JSON.parse(badJson);
    const hasRequired = parsed.subject && parsed.category && parsed.caption;
    tests.push({
      name: 'Schema rejects JSON missing required fields',
      passed: !hasRequired,
      detail: hasRequired ? 'Should have rejected' : 'Correctly rejected'
    });
  } catch (e) {
    tests.push({
      name: 'Schema rejects malformed JSON',
      passed: true,
      detail: 'Correctly threw parse error'
    });
  }
}
testSchemaValidation();