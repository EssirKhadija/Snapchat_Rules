# Test Suite Documentation

## Overview

The test suite provides comprehensive coverage for the SnapRules backend with unit tests, integration tests, API tests, and scheduler tests.

## Test Structure

```
tests/
├── unit/
│   ├── auth.service.spec.ts        # Authentication service tests
│   ├── rule-engine.spec.ts         # Rule evaluation logic tests
│   ├── logs.service.spec.ts        # Logging service tests
│   └── settings.service.spec.ts    # Settings service tests
├── api/
│   ├── auth.api.spec.ts            # Authentication API endpoints
│   ├── rules.api.spec.ts           # Rules API endpoints
│   ├── logs.api.spec.ts            # Logs API endpoints
│   └── settings.api.spec.ts        # Settings API endpoints
├── integration/
│   ├── sync.integration.spec.ts    # Sync workflow tests
│   └── rule-engine.integration.spec.ts  # Rule engine integration tests
├── scheduler/
│   └── scheduler.spec.ts           # Cron scheduler tests
├── fixtures/
│   └── mocks.ts                    # Mock factories for tests
└── setup.ts                        # Test environment configuration
```

## Running Tests

### All tests
```bash
npm test
```

### Watch mode
```bash
npm run test:watch
```

### Unit tests only
```bash
npm run test:unit
```

### Integration tests only
```bash
npm run test:integration
```

### API tests only
```bash
npm run test:api
```

### With coverage report
```bash
npm test -- --coverage
```

## Test Coverage Goals

- **Branches**: 50%+
- **Functions**: 50%+
- **Lines**: 50%+
- **Statements**: 50%+

## Test Categories

### Unit Tests
Test individual functions and services in isolation:
- Password hashing and verification
- JWT token generation and verification
- Rule condition evaluation (AND/OR logic)
- Nested condition groups
- Log filtering and pagination
- Settings CRUD operations
- Password change validation

### API Tests
Test HTTP endpoints with mocked services:
- User registration and login
- JWT refresh tokens
- Rule CRUD operations
- Rule execution (live and simulation)
- Log retrieval with search/filter/pagination
- User profile updates
- Password changes
- Settings management

### Integration Tests
Test workflows combining multiple services:
- Complete sync workflow (campaigns → ad squads → ads → rules)
- Rule evaluation across multiple campaigns
- Rule action execution (pause, budget changes, etc.)
- Simulation mode (no data modification)
- Execution logging and tracking
- Error handling in workflows

### Scheduler Tests
Test cron scheduling and job enqueueing:
- Cron expression parsing and scheduling
- Job enqueue on trigger
- Error handling during enqueue
- Support for various frequencies (every minute, every 5 minutes, hourly)
- Graceful error logging

## Mock Setup

All external dependencies are mocked:
- **Prisma ORM**: Database operations
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT operations
- **redis**: Caching layer
- **bullmq**: Job queue
- **node-cron**: Scheduler

## Mock Factories

Use the helper factories in `fixtures/mocks.ts` to create consistent test data:

```typescript
import { createMockUser, createMockRule, createMockCampaign } from '../fixtures/mocks';

const user = createMockUser({ email: 'custom@example.com' });
const rule = createMockRule({ priority: 2 });
const campaign = createMockCampaign({ spent: 500 });
```

## Writing New Tests

1. Choose the appropriate test category (unit/api/integration/scheduler)
2. Use mock factories from `fixtures/mocks.ts`
3. Mock external dependencies with `jest.mock()`
4. Clear mocks between tests with `beforeEach(() => jest.clearAllMocks())`
5. Use descriptive test names with `describe()` and `it()` blocks
6. Verify both success and error cases

Example:
```typescript
describe('My Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something successfully', async () => {
    const mockData = createMockUser();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockData);

    const result = await myService.doSomething();

    expect(result).toEqual(mockData);
  });

  it('should handle errors', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(myService.doSomething()).rejects.toThrow('DB error');
  });
});
```

## Continuous Integration

Tests should be run before deployment:
```bash
npm test -- --passWithNoTests
```

The `--passWithNoTests` flag allows CI/CD pipelines to proceed if no tests exist for a particular file.
