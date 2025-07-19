import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { GetReportDto } from './dto/get-report.dto';

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;

  const mockReportService = {
    getBalances: jest.fn(),
    getTopUp: jest.fn(),
    getTransfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('balance', () => {
    it('should call reportService.getBalances with correct query params and return result', async () => {
      const query: GetReportDto = {
        search: 'John',
        page: 2,
        limit: 5,
        filterDate: '15-07-2025',
      };

      const expectedResult = { data: [], total: 0, page: 2, lastPage: 0 };
      mockReportService.getBalances.mockResolvedValue(expectedResult);

      const result = await controller.balance(query);

      expect(service.getBalances).toHaveBeenCalledWith(
        query.search,
        query.page,
        query.limit,
        query.filterDate,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('topUp', () => {
    it('should call reportService.getTopUp with correct query params and return result', async () => {
      const query: GetReportDto = {
        search: 'Jane',
        page: 1,
        limit: 10,
        filterDate: '01-01-2025',
      };

      const expectedResult = { data: [], total: 0, page: 1, lastPage: 0 };
      mockReportService.getTopUp.mockResolvedValue(expectedResult);

      const result = await controller.topUp(query);

      expect(service.getTopUp).toHaveBeenCalledWith(
        query.search,
        query.page,
        query.limit,
        query.filterDate,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('transfer', () => {
    it('should call reportService.getTransfer with correct query params and return result', async () => {
      const query: GetReportDto = {
        search: 'Doe',
        page: 3,
        limit: 15,
        filterDate: '20-06-2025',
      };

      const expectedResult = { data: [], total: 0, page: 3, lastPage: 0 };
      mockReportService.getTransfer.mockResolvedValue(expectedResult);

      const result = await controller.transfer(query);

      expect(service.getTransfer).toHaveBeenCalledWith(
        query.search,
        query.page,
        query.limit,
        query.filterDate,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
