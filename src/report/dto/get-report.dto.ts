import { IsOptional, IsString, IsInt, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReportDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'filterDate must be in dd-MM-yyyy format',
  })
  filterDate?: string;
}
