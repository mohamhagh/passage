import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Consultant } from "../../consultants/entities/consultant.entity";
import { Booking } from "../../bookings/entities/booking.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Consultant, (consultant) => consultant.user)
  consultants: Consultant[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];
}
