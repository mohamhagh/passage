import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { DeleteBookingDto } from './dto/delete-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, createBookingDto);
  }

  @Get()
  findByUser(@Query('user_id') userId: string) {
 
    return this.bookingsService.findByUserId(userId);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(parseInt(id, 10), req.user.userId, updateBookingDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string, @Body() deleteBookingDto?: DeleteBookingDto) {
    const bookingId = deleteBookingDto?.bookingId || parseInt(id, 10);
    return this.bookingsService.remove(bookingId, req.user.userId);
  }
}

