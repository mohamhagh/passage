import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Consultant } from "../../consultants/entities/consultant.entity";

export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

@Entity("availabilities")
export class Availability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  consultant_id: string;

  @ManyToOne(() => Consultant, (consultant) => consultant.availabilities)
  @JoinColumn({ name: "consultant_id" })
  consultant: Consultant;

  @Column({
    type: "enum",
    enum: DayOfWeek,
  })
  day: DayOfWeek;

  @Column({ type: "date" })
  start: Date;

  @Column({ type: "date" })
  end: Date;

  @Column({ type: "time" })
  start_time: string;

  @Column({ type: "time" })
  end_time: string;
}
