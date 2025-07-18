// cif.module.ts
import { Module } from '@nestjs/common';
import { CifService } from './cif.service';
import { CifController } from './cif.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [CifService],
  controllers: [CifController],
})
export class CifModule { }
