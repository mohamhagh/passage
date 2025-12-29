import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Consultant } from "../../consultants/entities/consultant.entity";

export enum BookingStatus {
  DRAFT = "draft",
  CONFIRMED = "confirmed",
}

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "consultant_id", nullable: true })
  consultantId: string | null;

  @ManyToOne(() => Consultant, (consultant) => consultant.bookings, {
    nullable: true,
  })
  @JoinColumn({ name: "consultant_id" })
  consultant: Consultant | null;

  @Column({ type: "timestamp", nullable: true })
  start: Date | null;

  @Column({ type: "timestamp", nullable: true })
  end: Date | null;

  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.DRAFT,
  })
  status: BookingStatus;

  @Column({ name: "client_id" })
  clientId: string;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: "client_id" })
  client: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
