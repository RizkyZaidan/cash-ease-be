import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';
import { users } from '@prisma/client';

@Injectable()
export class CifService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto): Promise<users | null> {
        try {
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

            const tx = this.prisma.$transaction(async (prisma) => {
                const user = await prisma.users.create({
                    data: {
                        full_name: createUserDto.full_name,
                        username: createUserDto.username,
                        password: hashedPassword,
                        balance: new Decimal(0),
                    },
                });

                await prisma.user_roles.create({
                    data: {
                        user_id: user.id,
                        role_id: "ad62e29981b140f139acbe970654aa14",
                    },
                });

                await prisma.account.create({
                    data: {
                        user_id: user.id,
                        account_type: createUserDto.account_type,
                        account_no: createUserDto.account_no, 
                    },
                });

                return user;
            });

            return tx;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }


    async findAll(search?: string, page = 1, limit = 10) {
        const where = search
            ? {
                full_name: {
                    contains: search,
                    mode: 'insensitive' as any,
                },
            }
            : {};

        const [data, total] = await Promise.all([
            this.prisma.users.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_date: 'desc' },
                select: {
                    id: true,
                    full_name: true,
                    balance: true,
                    account: {
                        select: {
                            account_no: true,
                            account_type: true,
                        },
                        take: 1,
                    },
                },
            }),
            this.prisma.users.count({ where }),
        ]);

        const mappedData = data.map(user => {
            const account = user.account?.[0];
            return {
                id: user.id,
                full_name: user.full_name,
                balance: user.balance ? user.balance.toString() : null,
                account_no: account?.account_no ?? null,
                account_type: account?.account_type ?? null,
            };
        });


        return {
            data: mappedData,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.users.findUnique({
            where: { id },
            select: {
                id: true,
                full_name: true,
                balance: true,
                account: {
                    select: {
                        account_no: true,
                        account_type: true,
                    },
                    take: 1,
                },
            },
        });

        if (!user) throw new NotFoundException('User not found');

        const account = user.account?.[0];

        return {
            id: user.id,
            full_name: user.full_name,
            balance: user.balance,
            account_no: account?.account_no ?? null,
            account_type: account?.account_type ?? null,
        };
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        try {
            return await this.prisma.users.update({
                where: { id },
                data: updateUserDto,
                select: {
                    id: true,
                    full_name: true,
                    username: true,
                    created_date: true,
                    update_date: true,
                    balance: true,
                },
            });
        } catch {
            throw new NotFoundException('User not found');
        }
    }

    async remove(id: string) {
        try {
            await this.prisma.users.delete({ where: { id } });
            return { message: 'User deleted successfully' };
        } catch {
            throw new NotFoundException('User not found');
        }
    }
}
