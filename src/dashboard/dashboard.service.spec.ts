import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should return total users and total balance', async () => {
    const mockResult = [
      {
        totalUsers: '5',
        totalBalance: '12345.67',
      },
    ];

    mockPrisma.$queryRaw.mockResolvedValue(mockResult);

    const result = await service.getDashboard();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual({
      totalUsers: 5,
      totalBalance: 12345.67,
    });
  });
});
