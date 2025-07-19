import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

interface TotalUsersAndBalance {
  totalUsers: string;  // returned as string from DB
  totalBalance: string; // returned as string from DB
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(): Promise<{
    totalUsers: number;
    totalBalance: number;
  }> {
    const result = (await this.prisma.$queryRaw<TotalUsersAndBalance[]>`
      SELECT
        COUNT(*) AS "totalUsers",
        COALESCE(SUM(users.balance::DECIMAL), 0) AS "totalBalance"
      FROM users
      WHERE users.balance IS NOT NULL
    `);

    // result is an array with one object
    const totals = result[0];

    return {
      totalUsers: Number(totals.totalUsers),
      totalBalance: Number(totals.totalBalance),
    };
  }
}
