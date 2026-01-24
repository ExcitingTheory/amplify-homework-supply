/**
 * Mock File and Document data for Storybook
 * Extracted from actual application data
 */

import fileDetailsJson from './file-details.json';
import documentsJson from './files.json';

// Mock File records
export const mockFiles = [
  {
    id: "a57d7833-5fa7-4cb7-8b7a-ce7c6e10e551",
    name: "Japanese Wind 1.pdf",
    owner: "64d81418-7021-701d-9fed-a4c2e0735711",
    identityId: "us-east-1:b0eadde9-f02c-c71b-17a6-22ffd37d89c8",
    description: "Japanese language textbook - Chapter 1",
    prompt: null,
    model: null,
    variant: null,
    mimeType: "application/pdf",
    level: "PROTECTED",
    path: "files/Japanese Wind 1.pdf",
    duration: null,
    size: 4706654,
    generated: null,
    hex: null,
    byHex: null,
    thumbnail: null,
    waveformData: null,
    embedding: null,
    documentID: "e01017e1-fe7a-4521-b71c-09ec31b18639",
    createdAt: "2026-01-06T15:02:53.253Z",
    updatedAt: "2026-01-06T15:02:53.253Z",
    _version: 1,
    _lastChangedAt: 1767711773285,
    _deleted: null
  },
  {
    id: "mock-pdf-file-2",
    name: "report.pdf",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    description: "Sample report with vocabulary",
    mimeType: "application/pdf",
    level: "PROTECTED",
    path: "files/report.pdf",
    size: 123456,
    generated: false,
    documentID: "cd824b5b-2c66-41f8-8571-aa6794ff590c",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:30:00.000Z",
    _version: 2,
  },
  {
    id: "mock-pdf-file-3",
    name: "vocabulary-lesson.pdf",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    description: "Vocabulary lesson PDF with extracted content",
    mimeType: "application/pdf",
    level: "PUBLIC",
    path: "files/vocabulary-lesson.pdf",
    size: 567890,
    generated: false,
    documentID: "mock-document-3",
    createdAt: "2026-01-14T08:00:00.000Z",
    updatedAt: "2026-01-14T08:45:00.000Z",
    _version: 3,
  },
  {
    id: "mock-audio-file-1",
    name: "pronunciation-demo.mp3",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    description: "Sample pronunciation audio",
    mimeType: "audio/mpeg",
    level: "PUBLIC",
    path: "audio/pronunciation-demo.mp3",
    duration: 3.5,
    size: 56789,
    generated: true,
    waveformData: JSON.stringify([0.1, 0.3, 0.5, 0.7, 0.9, 0.7, 0.5, 0.3, 0.1]),
    documentID: null,
    createdAt: "2026-01-20T10:00:00.000Z",
    updatedAt: "2026-01-20T10:00:00.000Z",
    _version: 1,
  },
  {
    id: "mock-audio-file-2",
    name: "lesson-intro.mp3",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    description: "Lesson introduction audio",
    mimeType: "audio/mpeg",
    level: "PUBLIC",
    path: "audio/lesson-intro.mp3",
    duration: 5.2,
    size: 87654,
    generated: false,
    waveformData: JSON.stringify([0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2]),
    documentID: null,
    createdAt: "2026-01-19T14:30:00.000Z",
    updatedAt: "2026-01-19T14:30:00.000Z",
    _version: 1,
  },
  {
    id: "mock-image-file-1",
    name: "hiragana-chart.png",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    description: "Hiragana character chart",
    mimeType: "image/png",
    level: "PUBLIC",
    path: "images/hiragana-chart.png",
    size: 234567,
    generated: false,
    thumbnail: "thumbnails/hiragana-chart-thumb.png",
    documentID: null,
    createdAt: "2026-01-18T09:15:00.000Z",
    updatedAt: "2026-01-18T09:15:00.000Z",
    _version: 1,
  }
];

// Mock Document records (keyed by ID)
export const mockDocuments = {
  "e01017e1-fe7a-4521-b71c-09ec31b18639": {
    id: "e01017e1-fe7a-4521-b71c-09ec31b18639",
    owner: "64d81418-7021-701d-9fed-a4c2e0735711",
    identityId: "us-east-1:b0eadde9-f02c-c71b-17a6-22ffd37d89c8",
    filename: "Japanese Wind 1.pdf",
    s3Key: "files/Japanese Wind 1.pdf",
    status: "completed",
    pageCount: 160,
    extractedText: "This is a comprehensive Japanese language textbook covering basic grammar, vocabulary, and conversation patterns...",
    fileSize: 4706654,
    mimeType: "application/pdf",
    uploadedAt: "2026-01-06T15:02:53.253Z",
    createdAt: "2026-01-06T15:02:53.253Z",
    updatedAt: "2026-01-06T15:05:32.123Z",
    _version: 13,
  },
  "cd824b5b-2c66-41f8-8571-aa6794ff590c": {
    id: "cd824b5b-2c66-41f8-8571-aa6794ff590c",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    filename: "report.pdf",
    s3Key: "files/report.pdf",
    status: "completed",
    pageCount: 1,
    extractedText: "Annual report summary with key vocabulary terms...",
    fileSize: 123456,
    mimeType: "application/pdf",
    uploadedAt: "2026-01-15T10:00:00.000Z",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:30:00.000Z",
    _version: 6,
  },
  "mock-document-3": {
    id: "mock-document-3",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    filename: "vocabulary-lesson.pdf",
    s3Key: "files/vocabulary-lesson.pdf",
    status: "completed",
    pageCount: 5,
    extractedText: "Lesson on Japanese vocabulary covering common words and phrases. Includes examples and practice exercises.",
    fileSize: 567890,
    mimeType: "application/pdf",
    uploadedAt: "2026-01-14T08:00:00.000Z",
    createdAt: "2026-01-14T08:00:00.000Z",
    updatedAt: "2026-01-14T08:45:00.000Z",
    _version: 3,
  },
  ...Object.fromEntries(
    Object.entries(documentsJson).map(([id, doc]) => [
      id,
      {
        id,
        owner: doc.owner || "mock-user-id",
        identityId: doc.identityId || "us-east-1:mock-identity",
        filename: doc.filename || doc.s3Key?.split('/').pop() || "document.pdf",
        s3Key: doc.s3Key,
        status: doc.status,
        pageCount: doc.pageCount,
        extractedText: doc.extractedText || null,
        fileSize: doc.fileSize || null,
        mimeType: doc.mimeType || "application/pdf",
        uploadedAt: doc.uploadedAt || "2026-01-06T15:02:53.253Z",
        pageEmbeddings: doc.pageEmbeddings || null,
        embeddingsS3Key: doc.embeddingsS3Key || null,
        metadata: doc.metadata || null,
        createdAt: "2026-01-06T15:02:53.253Z",
        updatedAt: "2026-01-06T15:02:53.253Z",
        _version: doc._version || 1,
      }
    ])
  )
};

// Mock ParsedContent records (extracted vocabulary and questions from documents)
export const mockParsedContent = [
  {
    id: "parsed-content-1",
    owner: "64d81418-7021-701d-9fed-a4c2e0735711",
    identityId: "us-east-1:b0eadde9-f02c-c71b-17a6-22ffd37d89c8",
    documentID: "e01017e1-fe7a-4521-b71c-09ec31b18639",
    fileID: "a57d7833-5fa7-4cb7-8b7a-ce7c6e10e551",
    vocabularyJSON: JSON.stringify([
      {
        word: "こんにちは",
        pronunciation: "konnichiwa",
        definition: "Hello, good afternoon",
        context: "Used as a greeting during daytime hours",
        page: 12,
        approved: true,
      },
      {
        word: "ありがとう",
        pronunciation: "arigatou",
        definition: "Thank you",
        context: "Express gratitude in casual situations",
        page: 23,
        approved: true,
      },
      {
        word: "さようなら",
        pronunciation: "sayounara",
        definition: "Goodbye",
        context: "Formal farewell, often implies long separation",
        page: 34,
        approved: false,
      }
    ]),
    summariesJSON: JSON.stringify([
      {
        title: "Chapter 1: Basic Greetings",
        content: "Introduction to essential Japanese greetings and their appropriate usage contexts.",
        page_range: "10-25"
      },
      {
        title: "Chapter 2: Common Phrases",
        content: "Everyday expressions for polite conversation and social interactions.",
        page_range: "26-45"
      }
    ]),
    questionsJSON: JSON.stringify([
      {
        question: "What is the appropriate greeting for afternoon in Japanese?",
        expectedAnswer: "こんにちは (konnichiwa)",
        hint: "Think about the time of day",
        type: "short-answer"
      },
      {
        question: "When should you use さようなら?",
        expectedAnswer: "As a formal farewell when you won't see someone for a while",
        hint: "Consider the formality and duration of separation",
        type: "short-answer"
      }
    ]),
    modelUsed: "gpt-4",
    tokensUsed: 3500,
    processingTime: 12500,
    createdAt: "2026-01-06T15:05:00.000Z",
    importedAt: null,
    _version: 1,
  },
  {
    id: "parsed-content-2",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    documentID: "cd824b5b-2c66-41f8-8571-aa6794ff590c",
    fileID: "mock-pdf-file-2",
    vocabularyJSON: JSON.stringify([
      {
        word: "analysis",
        definition: "Detailed examination of elements or structure",
        context: "Financial analysis shows positive trends",
        page: 1,
        approved: true,
      },
      {
        word: "quarterly",
        definition: "Occurring every three months",
        context: "Quarterly reports are due at the end of each quarter",
        page: 1,
        approved: true,
      }
    ]),
    summariesJSON: JSON.stringify([
      {
        title: "Executive Summary",
        content: "Overview of key findings and recommendations",
        page_range: "1-1"
      }
    ]),
    questionsJSON: JSON.stringify([
      {
        question: "How often are quarterly reports submitted?",
        expectedAnswer: "Every three months",
        type: "short-answer"
      }
    ]),
    modelUsed: "gpt-4",
    tokensUsed: 890,
    processingTime: 3200,
    createdAt: "2026-01-15T10:25:00.000Z",
    importedAt: "2026-01-15T11:00:00.000Z",
    _version: 1,
  },
  {
    id: "parsed-content-3",
    owner: "mock-user-id",
    identityId: "us-east-1:mock-identity",
    documentID: "mock-document-3",
    fileID: "mock-pdf-file-3",
    vocabularyJSON: JSON.stringify([
      {
        word: "学生",
        pronunciation: "gakusei",
        definition: "Student",
        context: "I am a student at the university",
        page: 2,
        approved: true,
      },
      {
        word: "先生",
        pronunciation: "sensei",
        definition: "Teacher, professor",
        context: "Respectful term for educators",
        page: 3,
        approved: true,
      },
      {
        word: "勉強",
        pronunciation: "benkyou",
        definition: "Study, learning",
        context: "I study Japanese every day",
        page: 4,
        approved: false,
      }
    ]),
    summariesJSON: JSON.stringify([
      {
        title: "Education Vocabulary",
        content: "Common words related to school and learning",
        page_range: "2-4"
      }
    ]),
    questionsJSON: JSON.stringify([
      {
        question: "What is the Japanese word for student?",
        expectedAnswer: "学生 (gakusei)",
        type: "vocabulary"
      }
    ]),
    modelUsed: "gpt-4-turbo",
    tokensUsed: 1200,
    processingTime: 4800,
    createdAt: "2026-01-14T08:40:00.000Z",
    importedAt: null,
    _version: 1,
  }
];
