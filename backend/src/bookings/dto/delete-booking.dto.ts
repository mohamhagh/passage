import { IsNumber, IsNotEmpty } from "class-validator";

export class DeleteBookingDto {
  @IsNumber()
  @IsNotEmpty()
  bookingId: number;
}
