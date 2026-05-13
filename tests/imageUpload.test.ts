import test from 'node:test';
import assert from 'node:assert/strict';

test('Image Binary Conversion - extracts base64 from data URL', () => {
  const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const base64 = dataUrl.split(',')[1];
  assert.strictEqual(base64, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
});

test('Image Binary Conversion - formats base64 in data URL', () => {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const dataUrl = `data:image/png;base64,${base64}`;
  assert(dataUrl.startsWith('data:image/png;base64,'));
  assert(dataUrl.includes(base64));
});

test('Image Binary Conversion - handles empty base64', () => {
  const emptyBase64 = '';
  const dataUrl = `data:image/png;base64,${emptyBase64}`;
  assert.strictEqual(dataUrl, 'data:image/png;base64,');
});
