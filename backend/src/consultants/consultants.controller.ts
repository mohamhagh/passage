import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ConsultantsService } from './consultants.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Skill } from '../shared-config';

@Controller('consultants')
export class ConsultantsController {
  constructor(private consultantsService: ConsultantsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createConsultantDto: CreateConsultantDto) {
    return this.consultantsService.create(req.user.id, createConsultantDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query('user_id') userId?: string, @Query('skill') skill?: Skill) {
    const filters: any = {};
    if (userId) filters.user_id = userId;
    if (skill) filters.skill = skill;
    return this.consultantsService.findAll(filters);
  }
}

