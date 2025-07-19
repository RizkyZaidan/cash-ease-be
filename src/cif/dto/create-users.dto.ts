import { Decimal } from '@prisma/client/runtime/library';
import { IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  full_name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  account_no: string;

  @IsString()
  account_type: string;
}
