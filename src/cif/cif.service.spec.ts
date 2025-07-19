import { Test, TestingModule } from '@nestjs/testing';
import { CifService } from './cif.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundException } from '@nestjs/common';

describe('CifService', () => {
  let service: CifService;
  let prisma: PrismaService;

  const mockPrisma = {
    users: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CifService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CifService>(CifService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should hash password and create user', async () => {
      const dto = {
        full_name: 'John Doe',
        username: 'johndoe',
        password: 'password123',
        balance: new Decimal('100.50'),
      };

      jest.spyOn(bcrypt, 'hash').mockReturnValueOnce();
      mockPrisma.users.create.mockResolvedValue({ id: 'user-1', ...dto, password: 'hashedPassword' });

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: {
          full_name: dto.full_name,
          username: dto.username,
          password: 'hashedPassword',
          balance: dto.balance,
        },
      });
      expect(result).toEqual({ id: 'user-1', ...dto, password: 'hashedPassword' });
    });

    it('should default balance to Decimal(0) if not provided', async () => {
      const dto = {
        full_name: 'Jane Doe',
        username: 'janedoe',
        password: 'password123',
      };

      jest.spyOn(bcrypt, 'hash').mockReturnValueOnce();
      mockPrisma.users.create.mockResolvedValue({ id: 'user-2', ...dto, password: 'hashedPassword', balance: new Decimal(0) });

      const result = await service.create(dto as any);

      expect(prisma.users.create).toHaveBeenCalledWith({
        data: {
          full_name: dto.full_name,
          username: dto.username,
          password: 'hashedPassword',
          balance: new Decimal(0),
        },
      });
      expect(result.balance).toEqual(new Decimal(0));
    });
  });

  describe('findAll', () => {
    it('should return paginated users with account info', async () => {
      const users = [
        {
          id: 'user-1',
          full_name: 'John Doe',
          balance: new Decimal('100.50'),
          account: [{ account_no: '123', account_type: 'savings' }],
        },
      ];
      mockPrisma.users.findMany.mockResolvedValue(users);
      mockPrisma.users.count.mockResolvedValue(1);

      const result = await service.findAll('John', 1, 10);

      expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { full_name: { contains: 'John', mode: 'insensitive' } },
        skip: 0,
        take: 10,
      }));
      expect(prisma.users.count).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        data: [
          {
            id: 'user-1',
            full_name: 'John Doe',
            balance: new Decimal('100.50'),
            account_no: '123',
            account_type: 'savings',
          },
        ],
        total: 1,
        page: 1,
        lastPage: 1,
      });
    });

    it('should handle empty search', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      mockPrisma.users.count.mockResolvedValue(0);

      const result = await service.findAll(undefined, 1, 10);

      expect(prisma.users.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user with account info', async () => {
      const user = {
        id: 'user-1',
        full_name: 'John Doe',
        balance: new Decimal('100.50'),
        account: [{ account_no: '123', account_type: 'savings' }],
      };
      mockPrisma.users.findUnique.mockResolvedValue(user);

      const result = await service.findOne('user-1');

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          full_name: true,
          balance: true,
          account: {
            select: {
              account_no: true,
              account_type: true,
            },
            take: 1,
          },
        },
      });
      expect(result).toEqual({
        id: 'user-1',
        full_name: 'John Doe',
        balance: new Decimal('100.50'),
        account_no: '123',
        account_type: 'savings',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should hash password if provided and update user', async () => {
      const updateDto = {
        full_name: 'Updated Name',
        password: 'newpassword',
      };

      jest.spyOn(bcrypt, 'hash').mockReturnValueOnce();
      mockPrisma.users.update.mockResolvedValue({
        id: 'user-1',
        full_name: 'Updated Name',
        username: 'johndoe',
        created_date: new Date(),
        update_date: new Date(),
        balance: new Decimal('100.50'),
      });

      const result = await service.update('user-1', { ...updateDto });

      expect(bcrypt.hash).toHaveBeenCalledWith(updateDto.password, 10);
      expect(prisma.users.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ password: 'hashedPassword' }),
      }));
      expect(result).toHaveProperty('id', 'user-1');
    });

    it('should update user without password hashing if password not provided', async () => {
      const updateDto = {
        full_name: 'Updated Name',
      };

      mockPrisma.users.update.mockResolvedValue({
        id: 'user-1',
        full_name: 'Updated Name',
        username: 'johndoe',
        created_date: new Date(),
        update_date: new Date(),
        balance: new Decimal('100.50'),
      });

      const result = await service.update('user-1', updateDto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prisma.users.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user-1' },
        data: updateDto,
      }));
      expect(result).toHaveProperty('id', 'user-1');
    });

    it('should throw NotFoundException if update fails', async () => {
      mockPrisma.users.update.mockRejectedValue(new Error('Not found'));

      await expect(service.update('user-1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockPrisma.users.delete.mockResolvedValue({});

      const result = await service.remove('user-1');

      expect(prisma.users.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw NotFoundException if delete fails', async () => {
      mockPrisma.users.delete.mockRejectedValue(new Error('Not found'));

      await expect(service.remove('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
