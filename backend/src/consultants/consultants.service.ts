import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultant } from './entities/consultant.entity';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { Skill } from '../shared-config';

@Injectable()
export class ConsultantsService {
  constructor(
    @InjectRepository(Consultant)
    private consultantsRepository: Repository<Consultant>,
  ) {}

  async create(userId: string, createConsultantDto: CreateConsultantDto): Promise<Consultant> {
    // Check if user already has this skill
    const existing = await this.consultantsRepository.findOne({
      where: { user_id: userId, skill: createConsultantDto.skill },
    });
    if (existing) {
      throw new BadRequestException('User already has this consultant role');
    }

    const consultant = this.consultantsRepository.create({
      user_id: userId,
      skill: createConsultantDto.skill,
    });
    return this.consultantsRepository.save(consultant);
  }

  async findAll(filters?: { user_id?: string; skill?: Skill, id?: string }): Promise<Consultant[]> {
    return this.consultantsRepository.find({
      where: filters,
      relations: ['user'],
    });
  }
}

