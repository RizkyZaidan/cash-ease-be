import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [DashboardService],
  controllers: [DashboardController]
})
export class DashboardModule { }
