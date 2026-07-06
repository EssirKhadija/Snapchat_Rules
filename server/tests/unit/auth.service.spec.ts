import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authService from '../../src/services/auth.service';
import prisma from '../../src/prisma/client';

jest.mock('../../src/prisma/client');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_password_hash';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should throw error on hash failure', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash failed'));

      await expect(authService.hashPassword('password')).rejects.toThrow('Hash failed');
    });
  });

  describe('verifyPassword', () => {
    it('should verify password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_password_hash';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.verifyPassword(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false for incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.verifyPassword('wrong', 'hashedPassword');

      expect(result).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token', () => {
      const userId = 'user-123';
      const token = 'jwt_access_token';
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = authService.generateAccessToken(userId);

      expect(result).toBe(token);
      expect(jwt.sign).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode token', () => {
      const token = 'jwt_access_token';
      const decoded = { userId: 'user-123', iat: 1234567890 };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      const result = authService.verifyAccessToken(token);

      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it('should throw on invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyAccessToken('invalid')).toThrow('Invalid token');
    });
  });
});
