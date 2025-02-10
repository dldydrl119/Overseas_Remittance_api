import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity'; // User 엔티티와 연결

@Entity('transfers')
export class Transfer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User) 
    user: User;

    @Column({ type: 'float' })  // ✅ 정수 대신 float 타입 적용
    sourceAmount: number;

    @Column({ type: 'float' })  // ✅ 수수료도 소수점 가능하도록 수정
    fee: number;

    @Column({ type: 'float' })  // ✅ 환율은 소수점 값 필요
    exchangeRate: number;

    @Column()
    targetCurrency: string;

    @Column({ type: 'float' })  // ✅ 소수점 저장 가능하도록 float 적용
    targetAmount: number;

    @CreateDateColumn()
    requestedDate: Date;
}
