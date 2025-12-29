import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Not, MoreThan } from "typeorm";
import { Booking, BookingStatus } from "./entities/booking.entity";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { ConsultantsService } from "../consultants/consultants.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private consultantsService: ConsultantsService,
    private usersService: UsersService,
  ) {}

  async create(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    if (createBookingDto.clientId !== userId) {
      throw new BadRequestException(
        "You can only create a booking for yourself.",
      );
    }
    let status = BookingStatus.DRAFT;

    if (createBookingDto.consultantId !== null) {
      const consultant = await this.consultantsService.findOne(
        createBookingDto.consultantId,
        { user: true },
      );
      if (!consultant) {
        throw new NotFoundException("Consultant not found");
      }
    } else {
      // if the consultantId is not provided, the booking is a time off for the user across all consultant roles. No payment required.
      status = BookingStatus.CONFIRMED;
    }

    const booking = this.bookingsRepository.create({
      consultantId: createBookingDto.consultantId,
      clientId: createBookingDto.clientId,
      start: createBookingDto.start ? new Date(createBookingDto.start) : null,
      end: createBookingDto.end ? new Date(createBookingDto.end) : null,
      status,
    });
    if (status === BookingStatus.DRAFT) {
      setTimeout(async () => {
        // TODO: subscribe to a payment event and update the booking status accordingly,
        // timeout after X minutes and cancel the booking if not paid.
        await this.bookingsRepository.update(booking.id, {
          status: BookingStatus.CONFIRMED,
        });
      }, 10000);
    }
    return this.bookingsRepository.save(booking);
  }

  async update(
    id: number,
    userId: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ["client", "consultant"],
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.clientId !== userId) {
      throw new BadRequestException("You can only update your own bookings");
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
      relations: ["user", "client"],
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.clientId !== userId) {
      throw new BadRequestException("You can only delete your own bookings");
    }

    await this.bookingsRepository.remove(booking);
  }

  async findByConsultantIdForUser(consultantId: string): Promise<Booking[]> {
    const consultant = await this.consultantsService.findOne(consultantId, {
      user: { consultants: true },
    });
    const user = consultant.user;
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const userId = user.id;

    const bookings = await this.bookingsRepository.find({
      where: [
        { clientId: userId, consultantId: null, start: MoreThan(new Date()) }, // time off for the user across all consultant roles
        { consultantId, clientId: userId, start: MoreThan(new Date()) }, // time off for the user for the specific consultant role
        {
          consultantId: In(user.consultants.map((c) => c.id)),
          clientId: Not(userId),
          start: MoreThan(new Date()),
        }, // all bookings the user's consultant roles have
      ],
      relations: ["user", "client", "consultant"],
      order: { start: "ASC" },
    });

    return bookings;
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    const user = await this.usersService.findOne(userId, { consultants: true });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.bookingsRepository.find({
      where: [
        { consultantId: In(user.consultants.map((c) => c.id)) },
        { clientId: userId, consultantId: null },
      ],
      relations: ["user", "client", "consultant"],
      order: { start: "ASC" },
    });
  }
}
