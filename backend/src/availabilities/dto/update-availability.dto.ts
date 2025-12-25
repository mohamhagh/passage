import { IsEnum, IsDateString, IsString, IsOptional } from 'class-validator';
import { DayOfWeek } from '../entities/availability.entity';

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsEnum(DayOfWeek)
  day?: DayOfWeek;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;
}

