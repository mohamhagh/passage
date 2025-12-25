import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ConsultantsService } from '../consultants/consultants.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private consultantsService: ConsultantsService,
    private usersService: UsersService,
  ) {}

  async create(userId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
    let consultantUserId = userId;
    let status = BookingStatus.DRAFT;

    if (createBookingDto.consultantId !== null) {
      const consultant = (await this.consultantsService.findAll({id: createBookingDto.consultantId}))[0];
      if (!consultant) {
        throw new NotFoundException('Consultant not found');
      }
      consultantUserId = consultant.user_id;
    } else {
      if (createBookingDto.clientId !== createBookingDto.userId) {
        throw new BadRequestException('When consultantId is null, clientId must match the userId');
      }
      consultantUserId = createBookingDto.userId;
      status = BookingStatus.CONFIRMED;
    }

    const booking = this.bookingsRepository.create({
      userId: consultantUserId,
      consultantId: createBookingDto.consultantId,
      clientId: createBookingDto.clientId,
      start: createBookingDto.startTime ? new Date(createBookingDto.startTime) : null,
      end: createBookingDto.endTime ? new Date(createBookingDto.endTime) : null,
      status,
    });
    // TODO: dispatch event to wait for payment
    // if (status === BookingStatus.DRAFT) {
    //   dispatchEvent(new Event('waitForPayment', { booking }));
    //   await this.bookingsRepository.update(booking.id, { status: BookingStatus.CONFIRMED });
    // }
    return this.bookingsRepository.save(booking);
  }

  async update(id: number, userId: string, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'client', 'consultant'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId && booking.clientId !== userId) {
      throw new BadRequestException('You can only update your own bookings');
    }

    if (updateBookingDto.startTime) {
      booking.start = new Date(updateBookingDto.startTime);
    }
    if (updateBookingDto.endTime) {
      booking.end = new Date(updateBookingDto.endTime);
    }
    if (updateBookingDto.status) {
      booking.status = updateBookingDto.status;
    }

    return this.bookingsRepository.save(booking);
  }

  async remove(id: number, userId: string): Promise<void> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'client'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId && booking.clientId !== userId) {
      throw new BadRequestException('You can only delete your own bookings');
    }

    await this.bookingsRepository.remove(booking);
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const bookings = await this.bookingsRepository.find({
      where: [
        { userId },
        { clientId: userId },
      ],
      relations: ['user', 'client', 'consultant'],
      order: { start: 'ASC' },
    });

    const consultantIds = user.consultants?.map((c) => c.id) || [];
    if (consultantIds.length > 0) {
      const consultantBookings = await this.bookingsRepository.find({
        where: consultantIds.map((id) => ({ consultantId: id })),
        relations: ['user', 'client', 'consultant'],
        order: { start: 'ASC' },
      });
      bookings.push(...consultantBookings);
    }

    return bookings;
  }
}

