import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetOptionsDto {
    @IsString()
    id: string;
}
