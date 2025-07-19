import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call dashboardService.getDashboard and return result', async () => {
      const expectedResult = { totalUsers: 10, totalBalance: 1000 };
      mockDashboardService.getDashboard.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.getDashboard).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
