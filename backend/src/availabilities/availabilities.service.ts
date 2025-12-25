import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { ConsultantsService } from '../consultants/consultants.service';

@Injectable()
export class AvailabilitiesService {
  constructor(
    @InjectRepository(Availability)
    private availabilitiesRepository: Repository<Availability>,
    private consultantsService: ConsultantsService,
  ) {}

  async create(userId: string, createAvailabilityDto: CreateAvailabilityDto): Promise<Availability> {
    // Verify consultant belongs to user
    const consultants = await this.consultantsService.findAll({ user_id: userId });
    const consultant = consultants.find(c => c.id === createAvailabilityDto.consultant_id);
    if (!consultant) {
      throw new UnauthorizedException('Consultant does not belong to user');
    }

    const availability = this.availabilitiesRepository.create(createAvailabilityDto);
    return this.availabilitiesRepository.save(availability);
  }

  async update(
    userId: string,
    availabilityId: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    const availability = await this.availabilitiesRepository.findOne({
      where: { id: availabilityId },
      relations: ['consultant'],
    });
    
    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    // Verify consultant belongs to user
    const consultants = await this.consultantsService.findAll({ user_id: userId });
    const consultant = consultants.find(c => c.id === availability.consultant_id);
    if (!consultant) {
      throw new UnauthorizedException('Consultant does not belong to user');
    }

    Object.assign(availability, updateAvailabilityDto);
    return this.availabilitiesRepository.save(availability);
  }

  async remove(userId: string, availabilityId: string): Promise<void> {
    const availability = await this.availabilitiesRepository.findOne({
      where: { id: availabilityId },
      relations: ['consultant'],
    });
    
    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    // Verify consultant belongs to user
    const consultants = await this.consultantsService.findAll({ user_id: userId });
    const consultant = consultants.find(c => c.id === availability.consultant_id);
    if (!consultant) {
      throw new UnauthorizedException('Consultant does not belong to user');
    }

    await this.availabilitiesRepository.remove(availability);
  }

  async findByConsultant(consultantId: string): Promise<any> {
    const availabilities = await this.availabilitiesRepository.find({
      where: { consultant_id: consultantId },
      relations: ['consultant', 'consultant.user'],
      order: { day: 'ASC', start_time: 'ASC' },
    });

    return {
      availabilities,
    };
  }
}

