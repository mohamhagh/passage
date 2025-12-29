import {
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateBookingDto {
  @IsString()
  @IsOptional()
  consultantId: string | null;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsDateString()
  @IsNotEmpty()
  start: string;

  @IsDateString()
  @IsNotEmpty()
  end: string;
}
