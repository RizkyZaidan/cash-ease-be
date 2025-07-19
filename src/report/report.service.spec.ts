import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: PrismaService;

  const mockPrisma = {
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getBalances', () => {
    it('should return paginated balances with formatted dates and balances', async () => {
      const mockBalances = [
        {
          full_name: 'John Doe',
          date: '2025-07-18T12:00:00.000Z',
          account_no: '123456',
          account_type: 'savings',
          balance: new Decimal('1000.50'),
        },
      ];

      const mockTotal = [{ total: '1' }];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockBalances) // balances query
        .mockResolvedValueOnce(mockTotal);   // total count query

      const result = await service.getBalances('John', 1, 10, '18-07-2025');

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.lastPage).toBe(1);
      expect(result.data[0]).toEqual({
        full_name: 'John Doe',
        date: expect.any(String), // formatted date string
        account_no: '123456',
        account_type: 'savings',
        balance: '1000.5',
      });
    });
  });

  describe('getTopUp', () => {
    it('should return paginated top-up transactions with formatted dates and amounts', async () => {
      const mockTransactions = [
        {
          full_name: 'Jane Smith',
          created_date: '2025-07-18T12:00:00.000Z',
          amount: new Decimal('500.75'),
        },
      ];

      const mockTotal = [{ total: '1' }];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockTransactions) // transactions query
        .mockResolvedValueOnce(mockTotal);       // total count query

      const result = await service.getTopUp('Jane', 1, 10, '18-07-2025');

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.lastPage).toBe(1);
      expect(result.data[0]).toEqual({
        full_name: 'Jane Smith',
        date: expect.any(String), // formatted date string
        amount: '500.75',
      });
    });
  });

  describe('getTransfer', () => {
    it('should return paginated transfers with formatted dates and sender/receiver names', async () => {
      const mockTransfers = [
        {
          reference_no: 'ref123',
          nama_pengirim: 'Alice',
          nama_penerima: 'Bob',
          created_date: new Date('2025-07-18T12:00:00.000Z'),
        },
      ];

      const mockTotal = [{ total: '1' }];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockTransfers) // transfers query
        .mockResolvedValueOnce(mockTotal);    // total count query

      const result = await service.getTransfer('Alice', 1, 10, '18-07-2025');

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.lastPage).toBe(1);
      expect(result.data[0]).toEqual({
        nama_pengirim: 'Alice',
        nama_penerima: 'Bob',
        date: expect.any(String), // formatted date string
      });
    });
  });
});
