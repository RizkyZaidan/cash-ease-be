// src/users/dto/create-user.dto.ts
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    full_name: string;

    @IsString()
    username: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    balance?: bigint;
}
