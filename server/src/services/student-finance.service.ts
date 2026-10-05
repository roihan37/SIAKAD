import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { getStudentFinance as getStudentFinanceFromTuition, listStudentTuitionBills as listBillsFromTuition } from "./tuition.service";

export interface StudentFinanceResult {
    summary: {
        totalBills: number;
        totalPaid: number;
        totalOutstanding: number;
    };
    bills: Array<{
        id: string;
        academicYear: { id: number; year: string; semester: string };
        billNumber: string;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: string;
        status: string;
        payments: Array<{
            id: string;
            paymentNumber: string;
            amount: number;
            method: string;
            status: string;
            paidAt: string | null;
        }>;
    }>;
}

export interface UKTBillsResult {
    bills: Array<{
        id: string;
        academicYear: { id: number; year: string; semester: string };
        billNumber: string;
        amount: number;
        paidAmount: number;
        remainingAmount: number;
        dueDate: string;
        status: string;
        paidAt: string | null;
    }>;
}

export class StudentFinanceService {
    static async getFinance(userId: string, tahunAkademikId: number | undefined) {
        const now = new Date();
        return prisma.$transaction(
            (tx) => this.getFinanceInTransaction(tx, userId, tahunAkademikId, now),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
    }

    static async getUKTBills(userId: string) {
        const now = new Date();
        return prisma.$transaction(
            (tx) => this.getUKTBillsInTransaction(tx, userId, now),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
    }

    static async getMyUKT(userId: string) {
        const now = new Date();
        return prisma.$transaction(
            (tx) => this.getMyUKTInTransaction(tx, userId, now),
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
        );
    }

    /**
     * Get student finance data (includes UKT bills with payment history).
     * Used by GET /api/v1/students/:id/keuangan
     */
    private static async getFinanceInTransaction(
        prismaClient: Prisma.TransactionClient,
        userId: string,
        tahunAkademikId: number | undefined,
        now: Date
    ): Promise<StudentFinanceResult> {
        return getStudentFinanceFromTuition(prismaClient, userId, tahunAkademikId, now);
    }

    /**
     * Get UKT bills for a student by user ID.
     * Used by GET /api/v1/students/:id/ukt
     */
    private static async getUKTBillsInTransaction(
        prismaClient: Prisma.TransactionClient,
        userId: string,
        now: Date
    ): Promise<UKTBillsResult> {
        return listBillsFromTuition(prismaClient, userId, now);
    }

    /**
     * Get UKT bills for the currently authenticated student.
     * Used by GET /api/v1/students/me/ukt
     */
    private static async getMyUKTInTransaction(
        prismaClient: Prisma.TransactionClient,
        userId: string,
        now: Date
    ): Promise<UKTBillsResult> {
        return listBillsFromTuition(prismaClient, userId, now);
    }
}
