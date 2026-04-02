import '@testing-library/jest-dom';

import { vi, afterEach, beforeEach } from 'vitest';

// ----------------------------------------------------------------------
// localStorage mock
// ----------------------------------------------------------------------

const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  }),
  get length() {
    return Object.keys(localStorageStore).length;
  },
  key: vi.fn((index: number) => Object.keys(localStorageStore)[index] ?? null),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ----------------------------------------------------------------------
// import.meta.env mock
// ----------------------------------------------------------------------

vi.stubGlobal('import.meta', {
  env: {
    VITE_API_URL: 'https://api.zthorbit.com/api',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
  },
});

// ----------------------------------------------------------------------
// Cleanup between tests
// ----------------------------------------------------------------------

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  // Re-bind after clearAllMocks so implementations still work
  localStorageMock.getItem.mockImplementation((key: string) => localStorageStore[key] ?? null);
  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    localStorageStore[key] = value;
  });
  localStorageMock.removeItem.mockImplementation((key: string) => {
    delete localStorageStore[key];
  });
  localStorageMock.clear.mockImplementation(() => {
    Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
