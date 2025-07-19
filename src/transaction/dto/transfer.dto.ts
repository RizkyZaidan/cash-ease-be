import { Decimal } from '@prisma/client/runtime/library';
import { IsString, IsNotEmpty, IsDecimal } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  user_id_source: string;

  @IsString()
  @IsNotEmpty()
  user_id_destination: string;

  @IsString()
  @IsNotEmpty()
  user_account_no_source: string;

  @IsString()
  @IsNotEmpty()
  user_account_no_destination: string;

  @IsDecimal()
  amount: Decimal;
}
