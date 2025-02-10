import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    signup(userId: string, password: string, name: string, idType: string, idValue: string): Promise<Omit<User, 'password' | 'idValue'>>;
    findByUserId(userId: string): Promise<User | null>;
}
