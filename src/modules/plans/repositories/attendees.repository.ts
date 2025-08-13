import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Attendee } from '../entities/attendees.entity';

@Injectable()
export class AttendeeRepository {
    constructor() {}

    async saveAttendee(qr: QueryRunner, attendee: Partial<Attendee>): Promise<Attendee> {
        return await qr.manager.save(Attendee, attendee);
    }

    async deleteAttendee(qr: QueryRunner, planId: number, userId: number): Promise<void> {
        await qr.manager.delete(Attendee, {
            plan: { id: planId },
            user: { id: userId },
        });
    }
}
