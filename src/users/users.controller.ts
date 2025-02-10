import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto): Promise<{ resultCode: number; resultMsg: string }> { 
    await this.usersService.signup(
      createUserDto.userId,
      createUserDto.password,
      createUserDto.name,
      createUserDto.idType,
      createUserDto.idValue,
    );
  
    return {
      resultCode: 200,
      resultMsg: 'OK'
    };
  }
  
}
