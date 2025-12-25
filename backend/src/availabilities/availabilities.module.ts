import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitiesService } from './availabilities.service';
import { AvailabilitiesController } from './availabilities.controller';
import { Availability } from './entities/availability.entity';
import { ConsultantsModule } from '../consultants/consultants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Availability]),
    ConsultantsModule,
  ],
  controllers: [AvailabilitiesController],
  providers: [AvailabilitiesService],
})
export class AvailabilitiesModule {}

