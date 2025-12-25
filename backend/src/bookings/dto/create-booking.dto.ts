import { IsNotEmpty, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { isObject } from 'node:util';

export class CreateBookingDto {
  @IsString()
  @IsOptional()
  consultantId: string | null;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsDateString()
  @IsOptional()
  startTime: string;

  @IsDateString()
  @IsOptional()
  endTime: string;

  @IsString()
  @IsOptional()
  userId: string;
}

