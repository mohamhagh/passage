import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { BookingStatus } from "../entities/booking.entity";

export class UpdateBookingDto {
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
}
