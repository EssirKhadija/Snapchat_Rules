export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: 'hashed_password',
  fullName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockRule = (overrides = {}) => ({
  id: 'rule-1',
  userId: 'user-123',
  name: 'Test Rule',
  description: 'A test rule',
  enabled: true,
  priority: 0,
  cooldownMinutes: 0,
  conditions: [],
  actions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  lastExecutedAt: null,
  ...overrides,
});

export const createMockCampaign = (overrides = {}) => ({
  id: 'campaign-1',
  snapchatAccountId: 'account-1',
  externalCampaignId: 'external-1',
  name: 'Test Campaign',
  status: 'ACTIVE',
  dailyBudget: 100,
  spent: 0,
  impressions: 0,
  clicks: 0,
  ctr: 0,
  cpc: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockExecutionLog = (overrides = {}) => ({
  id: 'log-1',
  ruleId: 'rule-1',
  userId: 'user-123',
  targetType: 'campaign',
  targetId: 'campaign-1',
  targetName: 'Test Campaign',
  simulated: false,
  matched: true,
  actions: [],
  result: {},
  executedAt: new Date(),
  durationMs: 150,
  createdAt: new Date(),
  ...overrides,
});

export const createMockSettings = (overrides = {}) => ({
  id: 'settings-1',
  userId: 'user-123',
  timezone: 'UTC',
  currency: 'USD',
  language: 'en',
  inAppNotifications: true,
  emailNotifications: true,
  webhookNotifications: false,
  schedulerFrequency: '* * * * *',
  appName: 'SnapRules',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createAuthToken = (userId = 'user-123') => {
  // Base64-encoded JWT payload: { userId, iat: timestamp }
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
    JSON.stringify({ userId, iat: Math.floor(Date.now() / 1000) }),
  ).toString('base64')}.mock_signature`;
};
