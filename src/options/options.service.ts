import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class OptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(id: string) {
    const options = await this.prisma.options.findMany({
      where: {
        name: {
          contains: id,
        }
      },
      select: {
        id: true,
      },
    });

    if (options.length === 0) {
      return { data: [], total: 0 };
    }

    const optionIds = options.map(opt => opt.id);

    // Find all option_values where option_id is in optionIds
    const optionValues = await this.prisma.option_values.findMany({
      where: {
        option_id: {
          in: optionIds,
        },
        status: {
            contains:"active"
        }
      },
      select: {
        id: true,
        name: true,
        label: true,
        description: true,
        image: true,
      },
    });

    return {
      data: optionValues,
      total: optionValues.length,
    };
  }
}
