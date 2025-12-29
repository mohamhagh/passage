import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Availability } from "../../availabilities/entities/availability.entity";
import { Booking } from "../../bookings/entities/booking.entity";
import { Skill } from "../../shared-config";

@Entity("consultants")
export class Consultant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  user_id: string;

  @ManyToOne(() => User, (user) => user.consultants)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    type: "enum",
    enum: Skill,
  })
  skill: Skill;

  @OneToMany(() => Availability, (availability) => availability.consultant)
  availabilities: Availability[];

  @OneToMany(() => Booking, (booking) => booking.consultant)
  bookings: Booking[];
}
