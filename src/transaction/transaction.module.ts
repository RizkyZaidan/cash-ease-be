import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [TransactionService],
  controllers: [TransactionController]
})
export class TransactionModule { }
