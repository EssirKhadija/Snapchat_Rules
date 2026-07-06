import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Mock Redis for tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}));

// Mock BullMQ for tests
jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    process: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  QueueScheduler: jest.fn(() => ({
    close: jest.fn(),
  })),
}));

// Global test timeout
jest.setTimeout(10000);
