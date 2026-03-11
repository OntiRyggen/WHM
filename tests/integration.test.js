const { createUser, findUserByUsername } = require('../src/models/User');
const { AuthenticationService } = require('../src/services/AuthenticationService');
const { closePool } = require('../src/db/connection');

describe('Integration Tests', () => {
  let authService;

  beforeAll(() => {
    authService = new AuthenticationService();
  });

  afterAll(async () => {
    await closePool();
  });

  test('should create user and authenticate', async () => {
    const testUsername = `test_user_${Date.now()}`;
    
    // Create a test user
    const user = await createUser(testUsername, 'password123', 'MANAGER');
    expect(user).toBeDefined();
    expect(user.username).toBe(testUsername);
    expect(user.role).toBe('MANAGER');

    // Authenticate with correct credentials
    const authResult = await authService.authenticate(testUsername, 'password123');
    expect(authResult).toBeDefined();
    expect(authResult.token).toBeDefined();
    expect(authResult.user.username).toBe(testUsername);

    // Validate the token
    const validatedUser = await authService.validateToken(authResult.token);
    expect(validatedUser.username).toBe(testUsername);
    expect(validatedUser.role).toBe('MANAGER');
  });

  test('should reject invalid credentials', async () => {
    const testUsername = `test_user_${Date.now()}`;
    await createUser(testUsername, 'password123', 'WAREHOUSE_STAFF');

    await expect(
      authService.authenticate(testUsername, 'wrongpassword')
    ).rejects.toThrow('Invalid username or password');
  });

  test('should reject non-existent user', async () => {
    await expect(
      authService.authenticate('nonexistent_user', 'password')
    ).rejects.toThrow('Invalid username or password');
  });
});
