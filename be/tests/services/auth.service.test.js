const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const authService = require('../../src/services/auth.service');
const ApiError = require('../../src/utils/apiError');
const config = require('../../src/config/env');

// TDD Setup: Mock Mongoose User Model and other dependencies
jest.mock('../../src/models/User');
jest.mock('jsonwebtoken');

describe('Auth Service - Xác thực tài khoản', () => {

   describe('Function: login', () => {

      beforeEach(() => {
         jest.clearAllMocks();
      });

      // UTCID01: Email đúng, Account Active, Mật khẩu đúng -> Return { user, token }
      it('[UTCID01] Normal: Valid email and password for active user should succeed', async () => {
         const mockUser = {
            _id: 'user123',
            email: 'test@fpt.edu.vn',
            isActive: true,
            comparePassword: jest.fn().mockResolvedValue(true),
            save: jest.fn().mockResolvedValue(true)
         };

         // Mock Mongoose chain: User.findOne().select()
         const mockFindOne = { select: jest.fn().mockResolvedValue(mockUser) };
         User.findOne.mockReturnValue(mockFindOne);

         // Mock JWT Generation
         jwt.sign.mockReturnValue('mocked_access_token');

         const result = await authService.login('test@fpt.edu.vn', 'CorrectPassword123');

         expect(User.findOne).toHaveBeenCalledWith({ email: 'test@fpt.edu.vn' });
         expect(mockUser.comparePassword).toHaveBeenCalledWith('CorrectPassword123');
         expect(mockUser.save).toHaveBeenCalled(); // Ensure lastLogin was saved
         expect(jwt.sign).toHaveBeenCalled();

         expect(result).toHaveProperty('user');
         expect(result.user.password).toBeUndefined(); // Ensure password is obfuscated
         expect(result).toHaveProperty('token', 'mocked_access_token');
      });

      // UTCID02: Email không tồn tại -> Exception 'Invalid credentials'
      it('[UTCID02] Abnormal: Unknown email should throw Unauthorized', async () => {
         // Mock DB returns null
         const mockFindOne = { select: jest.fn().mockResolvedValue(null) };
         User.findOne.mockReturnValue(mockFindOne);

         await expect(authService.login('wrong@fpt.edu.vn', 'AnyPass')).rejects.toThrow(ApiError);
         await expect(authService.login('wrong@fpt.edu.vn', 'AnyPass')).rejects.toMatchObject({
            statusCode: 401,
            message: 'Invalid credentials'
         });
      });

      // UTCID03: Account bị Deactived -> Exception 'Account is deactivated'
      it('[UTCID03] Abnormal: Banned/Deactivated account should throw Forbidden', async () => {
         const mockUser = {
            _id: 'user123',
            email: 'banned@fpt.edu.vn',
            isActive: false, // Inactive account
         };

         const mockFindOne = { select: jest.fn().mockResolvedValue(mockUser) };
         User.findOne.mockReturnValue(mockFindOne);

         await expect(authService.login('banned@fpt.edu.vn', 'Pass')).rejects.toThrow(ApiError);
         await expect(authService.login('banned@fpt.edu.vn', 'Pass')).rejects.toMatchObject({
            statusCode: 403,
            message: 'Account is deactivated'
         });
      });

      // UTCID04: Sai Password -> Exception 'Invalid credentials'
      it('[UTCID04] Abnormal: Wrong password should throw Unauthorized', async () => {
         const mockUser = {
            _id: 'user123',
            email: 'test@fpt.edu.vn',
            isActive: true,
            // Mock bad password
            comparePassword: jest.fn().mockResolvedValue(false)
         };

         const mockFindOne = { select: jest.fn().mockResolvedValue(mockUser) };
         User.findOne.mockReturnValue(mockFindOne);

         await expect(authService.login('test@fpt.edu.vn', 'WrongPass')).rejects.toThrow(ApiError);
         await expect(authService.login('test@fpt.edu.vn', 'WrongPass')).rejects.toMatchObject({
            statusCode: 401,
            message: 'Invalid credentials'
         });
      });

   });

});
