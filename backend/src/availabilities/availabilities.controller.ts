import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private availabilitiesService: AvailabilitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilitiesService.create(req.user.id, createAvailabilityDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilitiesService.update(req.user.id, id, updateAvailabilityDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.availabilitiesService.remove(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findOne(@Query('consultant_id') consultantId: string) {
    return this.availabilitiesService.findByConsultant(consultantId);
  }
}

