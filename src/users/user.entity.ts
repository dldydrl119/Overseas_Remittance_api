import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column()
  idType: string;

  @Column()
  idValue: string;

  @Column({ default: 'personal' })
  type: string;

  @BeforeInsert()
  async encryptIdValue() {
    this.idValue = await bcrypt.hash(this.idValue, 10);
  }
}
