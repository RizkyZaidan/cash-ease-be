import { Decimal } from '@prisma/client/runtime/library';
import { IsString, IsNotEmpty, IsInt, IsDecimal } from 'class-validator';

export class TopUpDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    account_no: string;

    @IsDecimal()
    amount: Decimal;
}
