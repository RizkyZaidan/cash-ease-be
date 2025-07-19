import { Test, TestingModule } from '@nestjs/testing';
import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

describe('OptionsController', () => {
  let controller: OptionsController;
  let service: OptionsService;

  const mockOptionsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OptionsController],
      providers: [
        {
          provide: OptionsService,
          useValue: mockOptionsService,
        },
      ],
    }).compile();

    controller = module.get<OptionsController>(OptionsController);
    service = module.get<OptionsService>(OptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call optionsService.findAll with correct id and return result', async () => {
      const id = 'some-id';
      const expectedResult = { data: 'some data' };
      mockOptionsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({ id });

      expect(service.findAll).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
