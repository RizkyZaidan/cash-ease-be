import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from 'prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: PrismaService;

  const mockPrisma = {
    $transaction: jest.fn(),
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    balances: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('topUp', () => {
    it('should top up successfully', async () => {
      const topUpData = {
        id: 'user-1',
        account_no: 'acc-123',
        amount: new Decimal('100.50'),
      };

      // Mock prisma transaction
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique.mockResolvedValue({ balance: new Decimal('50.00') });
      mockPrisma.account.findFirst.mockResolvedValue({
        account_no: 'acc-123',
        account_type: 'savings',
      });
      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.balances.create.mockResolvedValue({});

      const result = await service.topUp(topUpData);

      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: topUpData.id },
        select: { balance: true },
      });
      expect(mockPrisma.users.update).toHaveBeenCalled();
      expect(mockPrisma.transaction.create).toHaveBeenCalled();
      expect(mockPrisma.balances.create).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Top Up Berhasil',
        newBalance: '150.50',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const topUpData = {
        id: 'user-1',
        account_no: 'acc-123',
        amount: new Decimal('100.50'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.topUp(topUpData)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if account not found', async () => {
      const topUpData = {
        id: 'user-1',
        account_no: 'acc-123',
        amount: new Decimal('100.50'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique.mockResolvedValue({ balance: new Decimal('50.00') });
      mockPrisma.account.findFirst.mockResolvedValue(null);

      await expect(service.topUp(topUpData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('transfer', () => {
    it('should transfer successfully', async () => {
      const transferData = {
        user_id_source: 'user-1',
        user_id_destination: 'user-2',
        user_account_no_source: 'acc-1',
        user_account_no_destination: 'acc-2',
        amount: new Decimal('75.25'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ balance: new Decimal('100.00') }) // source user
        .mockResolvedValueOnce({ balance: new Decimal('50.00') }); // destination user

      mockPrisma.account.findFirst
        .mockResolvedValueOnce({ account_no: 'acc-1', account_type: 'savings' })
        .mockResolvedValueOnce({ account_no: 'acc-2', account_type: 'checking' });

      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.balances.create.mockResolvedValue({});

      const result = await service.transfer(transferData);

      expect(mockPrisma.users.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.account.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrisma.users.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.balances.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: 'Transfer Berhasil' });
    });

    it('should throw NotFoundException if source user not found', async () => {
      const transferData = {
        user_id_source: 'user-1',
        user_id_destination: 'user-2',
        user_account_no_source: 'acc-1',
        user_account_no_destination: 'acc-2',
        amount: new Decimal('75.25'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique
        .mockResolvedValueOnce(null) // source user not found
        .mockResolvedValueOnce({ balance: new Decimal('50.00') });

      await expect(service.transfer(transferData)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if destination user not found', async () => {
      const transferData = {
        user_id_source: 'user-1',
        user_id_destination: 'user-2',
        user_account_no_source: 'acc-1',
        user_account_no_destination: 'acc-2',
        amount: new Decimal('75.25'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ balance: new Decimal('100.00') })
        .mockResolvedValueOnce(null); // destination user not found

      await expect(service.transfer(transferData)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if source balance insufficient', async () => {
      const transferData = {
        user_id_source: 'user-1',
        user_id_destination: 'user-2',
        user_account_no_source: 'acc-1',
        user_account_no_destination: 'acc-2',
        amount: new Decimal('150.00'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ balance: new Decimal('100.00') }) // source user balance less than amount
        .mockResolvedValueOnce({ balance: new Decimal('50.00') });

      await expect(service.transfer(transferData)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if source account not found', async () => {
      const transferData = {
        user_id_source: 'user-1',
        user_id_destination: 'user-2',
        user_account_no_source: 'acc-1',
        user_account_no_destination: 'acc-2',
        amount: new Decimal('50.00'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ balance: new Decimal('100.00') })
        .mockResolvedValueOnce({ balance: new Decimal('50.00') });

      mockPrisma.account.findFirst
        .mockResolvedValueOnce(null) // source account not found
        .mockResolvedValueOnce({ account_no: 'acc-2', account_type: 'checking' });

      await expect(service.transfer(transferData)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if destination account not found', async () => {
      const transferData = {
        user_id_source: 'user-1',
        user_id_destination: 'user-2',
        user_account_no_source: 'acc-1',
        user_account_no_destination: 'acc-2',
        amount: new Decimal('50.00'),
      };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return fn(mockPrisma);
      });

      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ balance: new Decimal('100.00') })
        .mockResolvedValueOnce({ balance: new Decimal('50.00') });

      mockPrisma.account.findFirst
        .mockResolvedValueOnce({ account_no: 'acc-1', account_type: 'savings' })
        .mockResolvedValueOnce(null); // destination account not found

      await expect(service.transfer(transferData)).rejects.toThrow(NotFoundException);
    });
  });
});
