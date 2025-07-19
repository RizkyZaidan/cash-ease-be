import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parse, startOfDay, endOfDay, format, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone, getTimezoneOffset } from 'date-fns-tz';
import { id as localeID } from 'date-fns/locale';
import { parseZonedTimeToUtc } from 'src/utilities/utility';

interface BalanceResult {
    full_name: string | null;
    date: string;
    account_no: string | null;
    account_type: string | null;
    balance: any;
}

interface TransactionResult {
    full_name: string | null;
    created_date: string | null;
    amount: string | null;
}

interface TransferResult {
    reference_no: string;
    nama_pengirim: string | null;
    nama_penerima: string | null;
    created_date: Date;
}

interface TotalCountResult {
    total: string;
}

@Injectable()
export class ReportService {
    constructor(private prisma: PrismaService) { }

    async getBalances(
        search?: string,
        page = 1,
        limit = 10,
        filterDate?: string,
    ): Promise<{
        data: Array<{
            full_name: string | null;
            date: string | null;
            account_no: string | null;
            account_type: string | null;
            balance: string | null;
        }>;
        total: number;
        page: number;
        lastPage: number;
    }> {
        const offset = (page - 1) * limit;
        const searchParam = search ? `%${search}%` : '%';
        const timeZone = 'Asia/Jakarta';

        let dateCondition = '';
        const params: (string | Date | number)[] = [searchParam, limit, offset];
        if (filterDate) {
            try {
                const parsedDate = parse(filterDate, 'dd-MM-yyyy', new Date());

                const startStr = formatInTimeZone(startOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
                const endStr = formatInTimeZone(endOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");

                const start = new Date(startStr);
                const end = new Date(endStr);

                dateCondition = `AND b.created_at BETWEEN $4 AND $5`;
                params.push(start, end);
            } catch {
                throw new BadRequestException({ message: 'filterDate must be in dd-MM-yyyy format' });
            }
        }

        const balances: BalanceResult[] = await this.prisma.$queryRawUnsafe(
            `
        WITH ranked_balances AS (
          SELECT
            b.*,
            u.full_name,
            a.account_no AS account_account_no,
            a.account_type AS account_account_type,
            ROW_NUMBER() OVER (
              PARTITION BY b.user_id, DATE(b.created_at)
              ORDER BY b.created_at DESC
            ) AS rn
          FROM balances b
          JOIN users u ON u.id = b.user_id
          LEFT JOIN account a ON a.user_id = u.id
          WHERE u.full_name ILIKE $1
          ${dateCondition}
        )
        SELECT
          full_name,
          created_at AS date,
          account_account_no AS account_no,
          account_account_type AS account_type,
          balance
        FROM ranked_balances
        WHERE rn = 1
        ORDER BY date DESC
        LIMIT $2 OFFSET $3;
      `,
            ...params,
        );

        const totalParams: (string | Date)[] = [searchParam];
        if (filterDate) {
            const parsedDate = parse(filterDate, 'dd-MM-yyyy', new Date());
            const startStr = formatInTimeZone(startOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
            const endStr = formatInTimeZone(endOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");

            totalParams.push(new Date(startStr), new Date(endStr));
        }

        const totalCountQuery = `
      SELECT COUNT(DISTINCT b.user_id || '-' || DATE(b.created_at)) AS total
      FROM balances b
      JOIN users u ON u.id = b.user_id
      WHERE u.full_name ILIKE $1
      ${filterDate ? 'AND b.created_at BETWEEN $2 AND $3' : ''}
    `;

        const totalResult: TotalCountResult[] = await this.prisma.$queryRawUnsafe(
            totalCountQuery,
            ...totalParams,
        );

        const total = Number(totalResult[0]?.total ?? 0);

        const mappedBalances = balances.map((b) => {
            if (!b.date) {
                return {
                    full_name: b.full_name,
                    date: null,
                    account_no: b.account_no,
                    account_type: b.account_type,
                    balance: b.balance ? b.balance.toString() : null,
                };
            }

            const utcDate = parseZonedTimeToUtc(b.date, timeZone);
            const dateInTimeZone = toZonedTime(utcDate, timeZone);

            return {
                full_name: b.full_name,
                date: format(dateInTimeZone, 'dd MMMM yyyy', { locale: localeID }),
                account_no: b.account_no,
                account_type: b.account_type,
                balance: b.balance ? b.balance.toString() : null,
            };
        });

        return {
            data: mappedBalances,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async getTopUp(
        search?: string,
        page = 1,
        limit = 10,
        filterDate?: string,
    ): Promise<{
        data: Array<{
            full_name: string | null;
            date: string | null;
            amount: string | null;
        }>;
        total: number;
        page: number;
        lastPage: number;
    }> {
        const offset = (page - 1) * limit;
        const searchParam = search ? `%${search}%` : '%';
        const timeZone = 'Asia/Jakarta';

        let dateCondition = '';
        const params: (string | Date | number)[] = [searchParam, limit, offset];
        if (filterDate) {
            try {
                const parsedDate = parse(filterDate, 'dd-MM-yyyy', new Date());

                const startStr = formatInTimeZone(startOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
                const endStr = formatInTimeZone(endOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");

                const start = new Date(startStr);
                const end = new Date(endStr);

                dateCondition = `AND t.created_date BETWEEN $4 AND $5`;
                params.push(start, end);
            } catch {
                throw new BadRequestException({ message: 'filterDate must be in dd-MM-yyyy format' });
            }
        }

        const transactions: TransactionResult[] = await this.prisma.$queryRawUnsafe(
            `
        SELECT
          u.full_name,
          t.created_date,
          t.amount
        FROM transaction t
        JOIN users u ON u.id = t.user_id
        WHERE u.full_name ILIKE $1
        AND t.transaction_type = 'topup'
        ${dateCondition}
        ORDER BY t.created_date DESC
        LIMIT $2 OFFSET $3;
      `,
            ...params,
        );

        const totalParams: (string | Date)[] = [searchParam];
        if (filterDate) {
            const parsedDate = parse(filterDate, 'dd-MM-yyyy', new Date());
            const startStr = formatInTimeZone(startOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
            const endStr = formatInTimeZone(endOfDay(parsedDate), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");

            totalParams.push(new Date(startStr), new Date(endStr));
        }

        const totalCountQuery = `
      SELECT COUNT(*) AS total
      FROM transaction t
      JOIN users u ON u.id = t.user_id
      WHERE u.full_name ILIKE $1
      AND t.transaction_type = 'topup'
      ${filterDate ? 'AND t.created_date BETWEEN $2 AND $3' : ''}
    `;

        const totalResult: TotalCountResult[] = await this.prisma.$queryRawUnsafe(
            totalCountQuery,
            ...totalParams,
        );

        const total = Number(totalResult[0]?.total ?? 0);

        const mappedTransactions = transactions.map((t) => {
            if (!t.created_date) {
                return { full_name: t.full_name, date: null, amount: t.amount?.toString() ?? null };
            }

            const utcDate = parseZonedTimeToUtc(t.created_date, timeZone);
            const dateInTimeZone = toZonedTime(utcDate, timeZone);

            return {
                full_name: t.full_name,
                date: format(dateInTimeZone, 'dd MMMM yyyy', { locale: localeID }),
                amount: t.amount ? t.amount.toString() : null,
            };
        });

        return {
            data: mappedTransactions,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async getTransfer(
        search?: string,
        page = 1,
        limit = 10,
        filterDate?: string,
    ): Promise<{
        data: Array<{
            nama_pengirim: string | null;
            nama_penerima: string | null;
            date: string | null;
        }>;
        total: number;
        page: number;
        lastPage: number;
    }> {
        const offset = (page - 1) * limit;
        const searchParam = search ? `%${search}%` : '%';
        const timeZone = 'Asia/Jakarta';

        // Prepare date filter if provided
        let dateCondition = '';
        const params: (string | Date | number)[] = [searchParam, searchParam]; // $1 and $2 for search params

        if (filterDate) {
            try {
                const parsedDate = parse(filterDate, 'dd-MM-yyyy', new Date());

                const startStr = formatInTimeZone(
                    startOfDay(parsedDate),
                    timeZone,
                    "yyyy-MM-dd'T'HH:mm:ssXXX",
                );
                const endStr = formatInTimeZone(
                    endOfDay(parsedDate),
                    timeZone,
                    "yyyy-MM-dd'T'HH:mm:ssXXX",
                );

                const start = new Date(startStr);
                const end = new Date(endStr);

                dateCondition = `AND t_sender.created_date BETWEEN $3::timestamp AND $4::timestamp`;
                params.push(start, end); // $3 and $4 for date range
            } catch {
                throw new BadRequestException({
                    message: 'filterDate must be in dd-MM-yyyy format',
                });
            }
        }

        params.push(limit, offset); 

        const limitParamIndex = filterDate ? 5 : 3;
        const offsetParamIndex = filterDate ? 6 : 4;

        const query = `
            WITH transfers AS (
            SELECT
                t_sender.reference_no,
                u_sender.full_name AS nama_pengirim,
                u_receiver.full_name AS nama_penerima,
                t_sender.created_date
            FROM transaction t_sender
            JOIN transaction t_receiver ON t_sender.reference_no = t_receiver.reference_no
            JOIN users u_sender ON u_sender.id = t_sender.user_id
            JOIN users u_receiver ON u_receiver.id = t_receiver.user_id
            WHERE t_sender.transaction_type = 'transfer'
                AND t_receiver.transaction_type = 'transfer'
                AND t_sender.balance_before > t_sender.balance_after
                AND t_receiver.balance_before < t_receiver.balance_after
                AND (u_sender.full_name ILIKE $1 OR u_receiver.full_name ILIKE $2)
                ${dateCondition}
            GROUP BY t_sender.reference_no, u_sender.full_name, u_receiver.full_name, t_sender.created_date
            ORDER BY t_sender.created_date DESC
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
            )
            SELECT * FROM transfers;
        `;

        // Execute the query with all params
        const transfersResult = await this.prisma.$queryRawUnsafe(query, ...params);
        const transfers = transfersResult as TransferResult[];

        // Total count query
        let totalCountQuery = `
            SELECT COUNT(DISTINCT t_sender.reference_no) AS total
            FROM transaction t_sender
            JOIN transaction t_receiver ON t_sender.reference_no = t_receiver.reference_no
            JOIN users u_sender ON u_sender.id = t_sender.user_id
            JOIN users u_receiver ON u_receiver.id = t_receiver.user_id
            WHERE t_sender.transaction_type = 'transfer'
            AND t_receiver.transaction_type = 'transfer'
            AND t_sender.balance_before > t_sender.balance_after
            AND t_receiver.balance_before < t_receiver.balance_after
            AND (u_sender.full_name ILIKE $1 OR u_receiver.full_name ILIKE $2)
        `;

        const totalParams: (string | Date)[] = [searchParam, searchParam];

        if (filterDate) {
            totalCountQuery += ` AND t_sender.created_date BETWEEN $3::timestamp AND $4::timestamp`;
            try {
                const parsedDate = parse(filterDate, 'dd-MM-yyyy', new Date());

                const startStr = formatInTimeZone(
                    startOfDay(parsedDate),
                    timeZone,
                    "yyyy-MM-dd'T'HH:mm:ssXXX",
                );
                const endStr = formatInTimeZone(
                    endOfDay(parsedDate),
                    timeZone,
                    "yyyy-MM-dd'T'HH:mm:ssXXX",
                );

                totalParams.push(new Date(startStr), new Date(endStr));
            } catch {
                throw new BadRequestException({
                    message: 'filterDate must be in dd-MM-yyyy format',
                });
            }
        }

        const totalResult: TotalCountResult[] = await this.prisma.$queryRawUnsafe(
            totalCountQuery,
            ...totalParams,
        );

        const total = Number(totalResult[0]?.total ?? 0);

        // Map dates to timezone and format
        const mappedTransfers = transfers.map((t) => {
            if (!t.created_date) {
                return {
                    nama_pengirim: t.nama_pengirim,
                    nama_penerima: t.nama_penerima,
                    date: null,
                };
            }

            const dateInTimeZone = toZonedTime(t.created_date, timeZone);
            return {
                nama_pengirim: t.nama_pengirim,
                nama_penerima: t.nama_penerima,
                date: format(dateInTimeZone, 'dd MMMM yyyy', { locale: localeID }),
            };
        });

        return {
            data: mappedTransfers,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }
}
