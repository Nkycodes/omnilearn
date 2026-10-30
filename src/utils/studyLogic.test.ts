import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  categorizeFile,
  validateWorkspaceTitle,
  buildMultimodalCitationList,
  calculateQuizScore,
  extractKeyTerms,
  QuizQuestion,
  StudyFile,
} from './studyLogic';

test('formatBytes formats bytes into human readable units', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(5242880), '5 MB');
});

test('categorizeFile correctly detects PDF, audio, and image files', () => {
  assert.equal(categorizeFile('notes.pdf', 'application/pdf'), 'document');
  assert.equal(categorizeFile('diagram.PNG', 'image/png'), 'image');
  assert.equal(categorizeFile('lecture.mp3', 'audio/mpeg'), 'audio');
  assert.equal(categorizeFile('recording.wav', 'audio/wav'), 'audio');
  assert.equal(categorizeFile('whiteboard.jpg', 'image/jpeg'), 'image');
  assert.equal(categorizeFile('code.py', 'text/x-python'), 'document');
});

test('validateWorkspaceTitle checks bounds and empty states', () => {
  assert.equal(validateWorkspaceTitle('').valid, false);
  assert.equal(validateWorkspaceTitle('  ').valid, false);
  assert.equal(validateWorkspaceTitle('A').valid, false);
  assert.equal(validateWorkspaceTitle('Valid Title').valid, true);
  assert.equal(validateWorkspaceTitle('a'.repeat(81)).valid, false);
});

test('buildMultimodalCitationList formats media citations', () => {
  const files: StudyFile[] = [
    { id: '1', originalName: 'Chapter1.pdf', fileType: 'document', size: 1000 },
    { id: '2', originalName: 'Lecture.mp3', fileType: 'audio', size: 2000 },
  ];
  const list = buildMultimodalCitationList(files);
  assert.match(list, /Chapter1\.pdf \(DOCUMENT\)/);
  assert.match(list, /Lecture\.mp3 \(AUDIO\)/);
});

test('calculateQuizScore computes correct percentages and pass flag', () => {
  const questions: QuizQuestion[] = [
    { question: 'Q1', options: ['A', 'B'], correctAnswer: 0, explanation: 'Exp1' },
    { question: 'Q2', options: ['A', 'B'], correctAnswer: 1, explanation: 'Exp2' },
  ];

  const fullScore = calculateQuizScore({ 0: 0, 1: 1 }, questions);
  assert.equal(fullScore.score, 2);
  assert.equal(fullScore.percentage, 100);
  assert.equal(fullScore.passed, true);

  const halfScore = calculateQuizScore({ 0: 0, 1: 0 }, questions);
  assert.equal(halfScore.score, 1);
  assert.equal(halfScore.percentage, 50);
  assert.equal(halfScore.passed, false);
});

test('extractKeyTerms extracts bold markdown phrases', () => {
  const md = 'Here is **Backpropagation** and another concept **Vector-Jacobian Product** in deep learning.';
  const terms = extractKeyTerms(md);
  assert.deepEqual(terms, ['Backpropagation', 'Vector-Jacobian Product']);
});

test('sanitizeMongoUri escapes unescaped special characters in password', async () => {
  const { sanitizeMongoUri } = await import('../../backend/db');

  // Case 1: Password with unescaped '@' and '#'
  const rawUri = 'mongodb+srv://admin:pass@123#word@cluster0.abcde.mongodb.net/omnilearn?retryWrites=true&w=majority';
  const cleanUri = sanitizeMongoUri(rawUri);
  assert.equal(cleanUri, 'mongodb+srv://admin:pass%40123%23word@cluster0.abcde.mongodb.net/omnilearn?retryWrites=true&w=majority');

  // Case 2: Already escaped password should not be double-escaped
  const alreadyEscaped = 'mongodb+srv://admin:pass%40123%23word@cluster0.abcde.mongodb.net/omnilearn';
  const clean2 = sanitizeMongoUri(alreadyEscaped);
  assert.equal(clean2, alreadyEscaped);

  // Case 3: Simple password without special chars
  const simple = 'mongodb://root:simplepass@localhost:27017/test';
  assert.equal(sanitizeMongoUri(simple), simple);

  // Case 4: Quotes around URI
  const withQuotes = '"mongodb+srv://user:my:pass@cluster.mongodb.net/db"';
  assert.equal(sanitizeMongoUri(withQuotes), 'mongodb+srv://user:my%3Apass@cluster.mongodb.net/db');
});

