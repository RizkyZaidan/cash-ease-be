import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TopUpDto } from './dto/topUp.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { randomHex32 } from 'src/utilities/utility';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class TransactionService {
    constructor(private prisma: PrismaService) { }

    async topUp(topUpData: TopUpDto) {
        return await this.prisma.$transaction(async (prisma) => {
            // Find current user balance
            const user = await prisma.users.findUnique({
                where: { id: topUpData.id },
                select: { balance: true },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Calculate new balance
            const currentBalance = user.balance ?? new Decimal(0);
            const amountToAdd = new Decimal(topUpData.amount);
            const newBalance = currentBalance.add(amountToAdd);

            // Update user balance
            await prisma.users.update({
                where: { id: topUpData.id },
                data: { balance: newBalance },
            });

            // Get account info for user
            const account = await prisma.account.findFirst({
                where: { user_id: topUpData.id },
                select: {
                    account_no: true,
                    account_type: true,
                },
            });

            if (!account) {
                throw new NotFoundException('Account not found for user');
            }

            // Create new transaction record
            await prisma.transaction.create({
                data: {
                    reference_no: randomHex32(),
                    user_id: topUpData.id,
                    transaction_type: "topup",
                    amount: topUpData.amount,
                    balance_before: currentBalance,
                    balance_after: newBalance,
                    created_date: new Date(),
                },
            });

            // Create new balance record
            await prisma.balances.create({
                data: {
                    user_id: topUpData.id,
                    balance: newBalance,
                    account_no: account.account_no,
                    account_type: account.account_type,
                    created_at: new Date(),
                },
            });

            return {
                message: 'Top Up Berhasil',
                newBalance: newBalance.toString(),
            };
        });
    }

    async transfer(transferData: TransferDto) {
        return await this.prisma.$transaction(async (prisma) => {

            // Find current user balance
            const userSource = await prisma.users.findUnique({
                where: { id: transferData.user_id_source },
                select: { balance: true },
            });
            const userDestination = await prisma.users.findUnique({
                where: { id: transferData.user_id_destination },
                select: { balance: true },
            });
            if (!userSource) {
                throw new NotFoundException('User Source not found');
            }
            if (!userDestination) {
                throw new NotFoundException('User Destination not found');
            }
            // Calculate new balance
            const sourceCurrentBalance = userSource.balance ?? new Decimal(0);
            const sourceAmountToDeduce = new Decimal(transferData.amount);
            const sourceNewBalance = sourceCurrentBalance.sub(sourceAmountToDeduce);
            // **Validation: Check if balance goes negative**
            if (sourceNewBalance.isNegative()) {
                throw new BadRequestException({ message: 'Saldo Anda Tidak Cukup' });
            }
            const destinationCurrentBalance = userDestination.balance ?? new Decimal(0);
            const destinationAmountToAdd = new Decimal(transferData.amount);
            const destinationNewBalance = destinationCurrentBalance.add(destinationAmountToAdd);

            // Update user balance
            await prisma.users.update({
                where: { id: transferData.user_id_source },
                data: { balance: sourceNewBalance },
            });
            await prisma.users.update({
                where: { id: transferData.user_id_destination },
                data: { balance: destinationNewBalance },
            });

            // Get account info for user
            const accountSource = await prisma.account.findFirst({
                where: { user_id: transferData.user_id_source },
                select: {
                    account_no: true,
                    account_type: true,
                },
            });
            const accountDestination = await prisma.account.findFirst({
                where: { user_id: transferData.user_id_destination },
                select: {
                    account_no: true,
                    account_type: true,
                },
            });

            if (!accountSource) {
                throw new NotFoundException('Account Source not found for user');
            }
            if (!accountDestination) {
                throw new NotFoundException('Account Destination not found for user');
            }

            const refNumber = randomHex32();
            // Create new transaction record
            await prisma.transaction.create({
                data: {
                    reference_no: refNumber,
                    user_id: transferData.user_id_source,
                    transaction_type: "transfer",
                    amount: transferData.amount,
                    balance_before: sourceCurrentBalance,
                    balance_after: sourceNewBalance,
                    created_date: new Date(),
                },
            });

            await prisma.transaction.create({
                data: {
                    reference_no: refNumber,
                    user_id: transferData.user_id_destination,
                    transaction_type: "transfer",
                    amount: transferData.amount,
                    balance_before: destinationCurrentBalance,
                    balance_after: destinationNewBalance,
                    created_date: new Date(),
                },
            });

            // Create new balance record
            await prisma.balances.create({
                data: {
                    user_id: transferData.user_id_source,
                    balance: sourceNewBalance,
                    account_no: accountSource.account_no,
                    account_type: accountSource.account_type,
                    created_at: new Date(),
                },
            });

            await prisma.balances.create({
                data: {
                    user_id: transferData.user_id_destination,
                    balance: destinationNewBalance,
                    account_no: accountDestination.account_no,
                    account_type: accountDestination.account_type,
                    created_at: new Date(),
                },
            });

            return {
                message: 'Transfer Berhasil',
            };
        });
    }
}
