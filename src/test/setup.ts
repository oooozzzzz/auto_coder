import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock IndexedDB
const mockIDBKeyRange = {
  bound: vi.fn(),
  only: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
    databases: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'IDBKeyRange', {
  value: mockIDBKeyRange,
  writable: true,
});

// Mock File API
global.File = class File {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  
  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.type = options.type || '';
    this.size = chunks.reduce((size, chunk) => size + chunk.length, 0);
    this.lastModified = Date.now();
  }
  
  text() {
    return Promise.resolve('');
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  stream() {
    return new ReadableStream();
  }
  
  slice() {
    return new File([], this.name, { type: this.type });
  }
} as any;

global.FileReader = class FileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onabort: ((event: any) => void) | null = null;
  
  readAsText() {
    setTimeout(() => {
      this.result = '';
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  
  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(0);
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  
  abort() {
    this.readyState = 2;
    if (this.onabort) this.onabort({ target: this });
  }
} as any;

// Mock Blob
global.Blob = class Blob {
  size: number;
  type: string;
  
  constructor(chunks: any[] = [], options: any = {}) {
    this.size = chunks.reduce((size, chunk) => size + chunk.length, 0);
    this.type = options.type || '';
  }
  
  text() {
    return Promise.resolve('');
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  stream() {
    return new ReadableStream();
  }
  
  slice() {
    return new Blob();
  }
} as any;

// Mock URL
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
} as any;

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Browser)',
  writable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};