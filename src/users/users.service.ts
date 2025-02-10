import { Injectable,BadRequestException,ConflictException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async signup(
    userId: string,
    password: string,
    name: string,
    idType: string,
    idValue: string
  ): Promise<Omit<User, 'password' | 'idValue'>> { 
    const existingUser = await this.usersRepository.findOne({ where: { userId } });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 사용자입니다.');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedIdValue = await bcrypt.hash(idValue, 10); 
  
    const user = this.usersRepository.create({
      userId,
      password: hashedPassword,
      name,
      idType,
      idValue: hashedIdValue, 
    });
  
    const savedUser = await this.usersRepository.save(user);
  
    return {
      id: savedUser.id,
      userId: savedUser.userId,
      name: savedUser.name,
      idType: savedUser.idType,
      type: savedUser.type
    } as Omit<User, 'password' | 'idValue'>; 
  }
  
  
  
  async findByUserId(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { userId } });
  }
}
