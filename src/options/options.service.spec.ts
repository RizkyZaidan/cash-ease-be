import { Test, TestingModule } from '@nestjs/testing';
import { OptionsService } from './options.service';
import { PrismaService } from 'prisma/prisma.service';

describe('OptionsService', () => {
  let service: OptionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    options: {
      findMany: jest.fn(),
    },
    option_values: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OptionsService>(OptionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return empty data and total 0 if no options found', async () => {
      mockPrisma.options.findMany.mockResolvedValue([]);

      const result = await service.findAll('test');

      expect(prisma.options.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'test' } },
        select: { id: true },
      });
      expect(result).toEqual({ data: [], total: 0 });
      expect(prisma.option_values.findMany).not.toHaveBeenCalled();
    });

    it('should return option values and total when options found', async () => {
      const mockOptions = [
        { id: 'opt1' },
        { id: 'opt2' },
      ];
      const mockOptionValues = [
        {
          id: 'val1',
          name: 'Value 1',
          label: 'Label 1',
          description: 'Desc 1',
          image: 'image1.png',
        },
        {
          id: 'val2',
          name: 'Value 2',
          label: 'Label 2',
          description: 'Desc 2',
          image: 'image2.png',
        },
      ];

      mockPrisma.options.findMany.mockResolvedValue(mockOptions);
      mockPrisma.option_values.findMany.mockResolvedValue(mockOptionValues);

      const result = await service.findAll('test');

      expect(prisma.options.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'test' } },
        select: { id: true },
      });

      expect(prisma.option_values.findMany).toHaveBeenCalledWith({
        where: {
          option_id: { in: ['opt1', 'opt2'] },
          status: { contains: 'active' },
        },
        select: {
          id: true,
          name: true,
          label: true,
          description: true,
          image: true,
        },
      });

      expect(result).toEqual({
        data: mockOptionValues,
        total: mockOptionValues.length,
      });
    });
  });
});
