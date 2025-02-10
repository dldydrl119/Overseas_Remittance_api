import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByUserId: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should validate user successfully', async () => {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    (usersService.findByUserId as jest.Mock).mockResolvedValue({
      userId: 'test@example.com',
      password: hashedPassword,
    });

    const result = await authService.validateUser('test@example.com', password);
    expect(result).toHaveProperty('userId', 'test@example.com');
  });

  it('should throw error for invalid user', async () => {
    (usersService.findByUserId as jest.Mock).mockResolvedValue(null);

    await expect(authService.validateUser('wrong@example.com', 'password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw error for invalid password', async () => {
    (usersService.findByUserId as jest.Mock).mockResolvedValue({
      userId: 'test@example.com',
      password: await bcrypt.hash('correctpassword', 10),
    });

    await expect(authService.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return a valid JWT token on login', async () => {
    (usersService.findByUserId as jest.Mock).mockResolvedValue({
      userId: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    });

    const result = await authService.login('test@example.com', 'password123');
    expect(result).toHaveProperty('token', 'mocked-jwt-token');
  });
});
