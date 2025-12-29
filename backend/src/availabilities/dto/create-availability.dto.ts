import {
  IsEnum,
  IsDateString,
  IsTimeZone,
  IsUUID,
  IsString,
} from "class-validator";
import { DayOfWeek } from "../entities/availability.entity";

export class CreateAvailabilityDto {
  @IsUUID()
  consultant_id: string;

  @IsEnum(DayOfWeek)
  day: DayOfWeek;

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;
}
