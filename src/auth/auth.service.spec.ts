import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data without password if valid', async () => {
      const user = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashedPassword',
        email: 'test@example.com',
      };

      mockPrisma.users.findUnique.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockReturnValueOnce();

      const result = await service.validateUser('testuser', 'password123');

      expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', user.password);
      expect(result).toEqual({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('unknown', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is missing', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 'user-1', username: 'testuser', password: null });

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashedPassword',
      };

      mockPrisma.users.findUnique.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockReturnValueOnce();

      await expect(service.validateUser('testuser', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token', () => {
      const user = { id: 'user-1', username: 'testuser' };
      mockJwtService.sign.mockReturnValue('signedToken');

      const result = service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({ username: user.username, user_id: user.id });
      expect(result).toEqual({ accessToken: 'signedToken' });
    });
  });
});
