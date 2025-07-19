import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ReportService } from './report.service';
import { GetReportDto } from './dto/get-report.dto';

@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('/balance')
    balance(@Query() query: GetReportDto) {
        return this.reportService.getBalances(query.search, query.page, query.limit, query.filterDate);
    }

    @Get('/top-up')
    topUp(@Query() query: GetReportDto) {
        return this.reportService.getTopUp(query.search, query.page, query.limit, query.filterDate);
    }

    @Get('/transfer')
    transfer(@Query() query: GetReportDto) {
        return this.reportService.getTransfer(query.search, query.page, query.limit, query.filterDate);
    }
}
