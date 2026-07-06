# Test Suite Summary

## Comprehensive Test Coverage for SnapRules Backend

### Total Test Files Created: 13

## Test Files Breakdown

### Unit Tests (4 files)

#### 1. `tests/unit/auth.service.spec.ts`
- Password hashing (`hashPassword`)
- Password verification (`verifyPassword`)
- Access token generation
- Token verification and error handling
- JWT decode validation
- Invalid token rejection

#### 2. `tests/unit/rule-engine.spec.ts`
- **Comparators**: gt, gte, lt, lte, eq, neq
- **Simple conditions**: Single field evaluation
- **AND groups**: All conditions must be true
- **OR groups**: Any condition can be true
- **Nested groups**: Complex condition hierarchies
- **Edge cases**: Null/undefined value handling

#### 3. `tests/unit/logs.service.spec.ts`
- Pagination with configurable page size
- Search by campaign name and rule name
- Filtering by matched status
- Filtering by simulated flag
- Filtering by ruleId and targetId
- Empty result handling

#### 4. `tests/unit/settings.service.spec.ts`
- Retrieve existing user settings
- Create default settings if not found
- Update timezone, currency, language
- Update notification preferences
- Update scheduler frequency
- Password change validation
- Current password verification
- New password hashing

---

### API Tests (4 files)

#### 1. `tests/api/auth.api.spec.ts`
- **POST /api/v1/auth/register**
  - Valid user registration
  - Email validation (invalid format)
  - Password length validation
  - Token response structure

- **POST /api/v1/auth/login**
  - Successful login with credentials
  - Invalid credentials rejection
  - Token generation
  - Refresh token creation

- **POST /api/v1/auth/refresh**
  - Token refresh with valid refresh token
  - Refresh token validation
  - New access token generation

#### 2. `tests/api/rules.api.spec.ts`
- **GET /api/v1/rules**
  - List user rules with authentication
  - Unauthorized access rejection
  - Rule ordering by priority
  - Multiple rules retrieval

- **POST /api/v1/rules**
  - Create new rule with conditions/actions
  - Rule validation
  - Auto-increment priority
  - Success status 201

- **POST /api/v1/rules/run**
  - Execute rules for all campaigns
  - Rule evaluation with metrics
  - Action execution tracking
  - Response with summaries

- **POST /api/v1/rules/simulate**
  - Simulation mode (no data changes)
  - Dry-run evaluation
  - Rules evaluated without side effects

#### 3. `tests/api/logs.api.spec.ts`
- **GET /api/v1/logs**
  - Retrieve logs with pagination
  - Filter by matched status (true/false)
  - Search by campaign name
  - Paginated response with total count
  - Unauthorized access rejection

#### 4. `tests/api/settings.api.spec.ts`
- **GET /api/v1/settings**
  - Retrieve user settings
  - Default values for new users

- **PUT /api/v1/settings**
  - Update timezone
  - Update currency
  - Update language
  - Update notification preferences
  - Update scheduler frequency

- **PUT /api/v1/settings/profile**
  - Update fullName
  - Update email with uniqueness check

- **PUT /api/v1/settings/password**
  - Change password with current password verification
  - Error on incorrect current password
  - Successful password hash update

---

### Integration Tests (2 files)

#### 1. `tests/integration/sync.integration.spec.ts`
- **syncAllData Workflow**
  - Sync campaigns, ad squads, ads in sequence
  - Rule engine execution after sync
  - Logging of workflow start/completion
  - Error handling and logging

#### 2. `tests/integration/rule-engine.integration.spec.ts`
- **runRuleEngine**
  - Evaluate all rules for all campaigns
  - Execute actions for matched rules
  - Update lastExecutedAt timestamp
  - Create execution logs
  - Error handling during rule evaluation

- **simulateRuleEngine**
  - Simulate without data modification
  - Flag as simulated in response
  - No database update calls

---

### Scheduler Tests (1 file)

#### 1. `tests/scheduler/scheduler.spec.ts`
- **Cron Scheduler**
  - Initialize with correct cron expression
  - Enqueue jobs on trigger
  - Log scheduler start
  - Handle enqueue errors gracefully

- **Frequency Variations**
  - Every minute: `* * * * *`
  - Every 5 minutes: `*/5 * * * *`
  - Hourly: `0 * * * *`

---

## Test Utilities & Fixtures

### Mock Factories (`tests/fixtures/mocks.ts`)
- `createMockUser()`
- `createMockRule()`
- `createMockCampaign()`
- `createMockExecutionLog()`
- `createMockSettings()`
- `createAuthToken()`

### Setup (`tests/setup.ts`)
- Jest configuration
- Global mocks for Redis, BullMQ
- Test timeout configuration

---

## Coverage Areas

✅ **Authentication**
- Registration and login
- Token generation and validation
- Password hashing and verification
- Refresh token flow

✅ **Rules & Automation**
- Condition evaluation (simple, AND, OR, nested)
- Rule execution and simulation
- Action execution (pause, resume, budget changes)
- Priority-based ordering

✅ **Logging & History**
- Execution log creation
- Search and filtering
- Pagination support
- Error tracking

✅ **Settings & Preferences**
- Profile management
- Password changes
- User preferences (timezone, currency, language)
- Notification preferences
- Scheduler configuration

✅ **Synchronization**
- Campaign sync workflow
- Ad squad sync
- Ad sync
- Metrics refresh

✅ **Scheduling**
- Cron-based scheduling
- Job enqueueing
- Error recovery
- Configurable frequencies

---

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### By Category
```bash
npm run test:unit
npm run test:integration
npm run test:api
```

### With Coverage
```bash
npm test -- --coverage
```

---

## Test Statistics

- **Total Test Suites**: 13
- **Estimated Test Cases**: 70+
- **Mocked Dependencies**: 6 (Prisma, bcrypt, JWT, Redis, BullMQ, node-cron)
- **Coverage Target**: 50%+ (branches, functions, lines, statements)

---

## Environment

- **Framework**: Jest 29.5.0
- **TypeScript**: ts-jest
- **HTTP Testing**: supertest
- **Config**: jest.config.js
- **Environment File**: .env.test
