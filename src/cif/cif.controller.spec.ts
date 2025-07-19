import { Test, TestingModule } from '@nestjs/testing';
import { CifController } from './cif.controller';
import { CifService } from './cif.service';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('CifController', () => {
  let controller: CifController;
  let service: CifService;

  const mockCifService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CifController],
      providers: [
        {
          provide: CifService,
          useValue: mockCifService,
        },
      ],
    }).compile();

    controller = module.get<CifController>(CifController);
    service = module.get<CifService>(CifService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call cifService.create with CreateUserDto and return result', async () => {
      const createUserDto: CreateUserDto = {
        full_name: 'John Doe',
        username: 'johndoe',
        password: 'password123',
        balance: new Decimal('100.50'),
      };

      const expectedResult = { id: 'user-1', ...createUserDto };
      mockCifService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call cifService.findAll with search, page, limit and return result', async () => {
      const query: GetUsersDto = {
        search: 'john',
        page: 2,
        limit: 5,
      };

      const expectedResult = {
        data: [],
        total: 0,
        page: 2,
        lastPage: 0,
      };
      mockCifService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query.search, query.page, query.limit);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call cifService.findOne with id and return result', async () => {
      const id = 'user-1';
      const expectedResult = { id, full_name: 'John Doe' };
      mockCifService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call cifService.update with id and UpdateUserDto and return result', async () => {
      const id = 'user-1';
      const updateUserDto: UpdateUserDto = {
        full_name: 'John Updated',
      };

      const expectedResult = { id, ...updateUserDto };
      mockCifService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(id, updateUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call cifService.remove with id and return result', async () => {
      const id = 'user-1';
      const expectedResult = { deleted: true };
      mockCifService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
