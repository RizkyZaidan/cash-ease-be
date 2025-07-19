import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TopUpDto } from './dto/topUp.dto';
import { TransactionService } from './transaction.service';
import { TransferDto } from './dto/transfer.dto';

@UseGuards(JwtAuthGuard)
@Controller('transaction')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @Post('/top-up')
    topUp(@Body() topUp: TopUpDto) {
        return this.transactionService.topUp(topUp);
    }

    @Post('/transfer')
    transfer(@Body() transferDto: TransferDto) {
        return this.transactionService.transfer(transferDto);
    }
}
