import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepo;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should hash password correctly', async () => {
    const password = 'testpassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    expect(await bcrypt.compare(password, hashedPassword)).toBeTruthy();
  });

  it('should not allow duplicate userId', async () => {
    mockUserRepo.findOne.mockResolvedValue({ userId: 'test@example.com' });

    await expect(
      service.signup('test@example.com', '1234abcd', '홍길동', 'REG_NO', '900101-1234567')
    ).rejects.toThrow('이미 존재하는 사용자입니다.');
  });

  it('should create a new user successfully', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    mockUserRepo.save.mockResolvedValue({
      id: '1234',
      userId: 'test@example.com',
      name: '홍길동',
      idType: 'REG_NO',
      type: 'personal',
    });

    const result = await service.signup('test@example.com', '1234abcd', '홍길동', 'REG_NO', '900101-1234567');
    expect(result).toEqual({
      id: '1234',
      userId: 'test@example.com',
      name: '홍길동',
      idType: 'REG_NO',
      type: 'personal',
    });
  });
});
