import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TopUpDto } from './dto/topUp.dto';
import { TransferDto } from './dto/transfer.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: TransactionService;

  const mockTransactionService = {
    topUp: jest.fn(),
    transfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('topUp', () => {
    it('should call transactionService.topUp with correct dto and return result', async () => {
      const topUpDto: TopUpDto = {
        id: 'some-id',
        account_no: '1234567890',
        amount: new Decimal('100.50'),
      };

      const expectedResult = { success: true, message: 'Top up successful' };
      mockTransactionService.topUp.mockResolvedValue(expectedResult);

      const result = await controller.topUp(topUpDto);

      expect(service.topUp).toHaveBeenCalledWith(topUpDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('transfer', () => {
    it('should call transactionService.transfer with correct dto and return result', async () => {
      const transferDto: TransferDto = {
        user_id_source: 'user-123',
        user_id_destination: 'user-456',
        user_account_no_source: '1234567890',
        user_account_no_destination: '0987654321',
        amount: new Decimal('50.75'),
      };

      const expectedResult = { success: true, message: 'Transfer successful' };
      mockTransactionService.transfer.mockResolvedValue(expectedResult);

      const result = await controller.transfer(transferDto);

      expect(service.transfer).toHaveBeenCalledWith(transferDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
