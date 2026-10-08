import { Prisma, Role, StatusKRS } from "@prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";

type DatabaseClient = Pick<
    Prisma.TransactionClient,
    "user" | "tahunAkademik" | "periodeKRS" | "kRS" | "kRSDetail" | "kelasMataKuliah"
>;

function getOfferingSelect(tahunAkademikId: number) {
    return {
        id: true,
        mataKuliah: {
            select: { id: true, kode: true, nama: true, sks: true },
        },
        kelas: {
            select: { id: true, nama: true },
        },
        dosen: {
            select: {
                id: true,
                nidn: true,
                user: { select: { name: true } },
            },
        },
        jadwal: {
            where: { tahunAkademikId },
            select: {
                id: true,
                hari: true,
                hariUrutan: true,
                jamMulai: true,
                jamSelesai: true,
                ruangan: {
                    select: { id: true, kode: true, nama: true, gedung: true },
                },
            },
            orderBy: [{ hariUrutan: "asc" }, { jamMulai: "asc" }, { id: "asc" }],
        },
    } satisfies Prisma.KelasMataKuliahSelect;
}

type Offering = Prisma.KelasMataKuliahGetPayload<{ select: ReturnType<typeof getOfferingSelect> }>;
type Schedule = Offering["jadwal"][number];

interface StudentContext {
    mahasiswaId: string;
    prodiId: number;
}

interface AcademicYear {
    id: number;
    tahun: string;
    semester: "GANJIL" | "GENAP";
    isActive: boolean;
}

interface KrsPeriod {
    id: number;
    tahunAkademikId: number;
    mulai: Date;
    selesai: Date;
    isActive: boolean;
}

interface ScheduleConflict {
    firstKelasMataKuliahId: number;
    secondKelasMataKuliahId: number;
    hari: Schedule["hari"];
    jamMulai: string;
    jamSelesai: string;
}

function isPeriodOpen(period: KrsPeriod | null, now: Date): boolean {
    return Boolean(period?.isActive && period.mulai <= now && now <= period.selesai);
}

function isEditableStatus(status: StatusKRS | null): boolean {
    return status === null || status === StatusKRS.DRAFT || status === StatusKRS.DITOLAK;
}

function schedulesOverlap(first: Schedule, second: Schedule): boolean {
    return first.hari === second.hari && first.jamMulai < second.jamSelesai && second.jamMulai < first.jamSelesai;
}

export function findScheduleConflict(offerings: Offering[]): ScheduleConflict | null {
    for (let firstIndex = 0; firstIndex < offerings.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < offerings.length; secondIndex += 1) {
            const first = offerings[firstIndex];
            const second = offerings[secondIndex];
            for (const firstSchedule of first.jadwal) {
                const secondSchedule = second.jadwal.find((schedule) => schedulesOverlap(firstSchedule, schedule));
                if (secondSchedule) {
                    return {
                        firstKelasMataKuliahId: first.id,
                        secondKelasMataKuliahId: second.id,
                        hari: firstSchedule.hari,
                        jamMulai: firstSchedule.jamMulai > secondSchedule.jamMulai ? firstSchedule.jamMulai : secondSchedule.jamMulai,
                        jamSelesai: firstSchedule.jamSelesai < secondSchedule.jamSelesai ? firstSchedule.jamSelesai : secondSchedule.jamSelesai,
                    };
                }
            }
        }
    }
    return null;
}

function findDuplicateCourse(offeringList: Offering[]): Offering | null {
    const courseIds = new Set<number>();
    return offeringList.find((offering) => {
        if (courseIds.has(offering.mataKuliah.id)) return true;
        courseIds.add(offering.mataKuliah.id);
        return false;
    }) ?? null;
}

function mapOffering(offering: Offering, selected: boolean, canSelect: boolean, unavailableReason: string | null) {
    return {
        kelasMataKuliahId: offering.id,
        course: offering.mataKuliah,
        class: offering.kelas,
        lecturer: {
            id: offering.dosen.id,
            nidn: offering.dosen.nidn,
            name: offering.dosen.user.name,
        },
        schedules: offering.jadwal.map((schedule) => ({
            id: schedule.id,
            hari: schedule.hari,
            hariUrutan: schedule.hariUrutan,
            jamMulai: schedule.jamMulai,
            jamSelesai: schedule.jamSelesai,
            room: schedule.ruangan,
        })),
        selected,
        canSelect,
        unavailableReason,
    };
}

async function getStudentContext(db: DatabaseClient, userId: string): Promise<StudentContext> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            mahasiswa: { select: { id: true, prodiId: true, status: true } },
        },
    });

    if (!user || user.role !== Role.Mahasiswa || !user.mahasiswa) {
        throw new AppError(404, "STUDENT_NOT_FOUND", "Data mahasiswa tidak ditemukan.");
    }
    if (user.mahasiswa.status !== "Aktif") {
        throw new AppError(409, "STUDENT_NOT_ACTIVE", "Mahasiswa yang tidak aktif tidak dapat mengelola KRS.");
    }

    return { mahasiswaId: user.mahasiswa.id, prodiId: user.mahasiswa.prodiId };
}

async function getAcademicYear(db: DatabaseClient, tahunAkademikId?: number): Promise<AcademicYear> {
    const academicYear = tahunAkademikId === undefined
        ? await db.tahunAkademik.findFirst({
            where: { isActive: true },
            orderBy: [{ tahun: "desc" }, { id: "desc" }],
            select: { id: true, tahun: true, semester: true, isActive: true },
        })
        : await db.tahunAkademik.findUnique({
            where: { id: tahunAkademikId },
            select: { id: true, tahun: true, semester: true, isActive: true },
        });

    if (!academicYear) {
        throw new AppError(404, "ACADEMIC_YEAR_NOT_FOUND", "Tahun akademik tidak ditemukan.");
    }
    return academicYear;
}

async function getKrsPeriod(db: DatabaseClient, tahunAkademikId: number): Promise<KrsPeriod | null> {
    const activePeriod = await db.periodeKRS.findFirst({
        where: { tahunAkademikId, isActive: true },
        orderBy: [{ mulai: "desc" }, { id: "desc" }],
        select: { id: true, tahunAkademikId: true, mulai: true, selesai: true, isActive: true },
    });
    if (activePeriod) return activePeriod;

    return db.periodeKRS.findFirst({
        where: { tahunAkademikId },
        orderBy: [{ mulai: "desc" }, { id: "desc" }],
        select: { id: true, tahunAkademikId: true, mulai: true, selesai: true, isActive: true },
    });
}

async function validateSelection(
    db: DatabaseClient,
    context: StudentContext,
    academicYearId: number,
    kelasMataKuliahIds: number[]
): Promise<Offering[]> {
    const uniqueIds = new Set(kelasMataKuliahIds);
    if (uniqueIds.size !== kelasMataKuliahIds.length) {
        throw new AppError(400, "DUPLICATE_KRS_OFFERING", "Kelas mata kuliah tidak boleh dipilih lebih dari satu kali.");
    }

    const offerings = kelasMataKuliahIds.length === 0 ? [] : await db.kelasMataKuliah.findMany({
        where: {
            id: { in: kelasMataKuliahIds },
            kelas: { prodiId: context.prodiId, tahunAkademikId: academicYearId },
        },
        select: getOfferingSelect(academicYearId),
    });

    if (offerings.length !== kelasMataKuliahIds.length) {
        const foundIds = new Set(offerings.map((offering) => offering.id));
        throw new AppError(400, "INVALID_KRS_OFFERING", "Satu atau lebih kelas mata kuliah tidak tersedia untuk mahasiswa ini.", {
            details: { invalidKelasMataKuliahIds: kelasMataKuliahIds.filter((id) => !foundIds.has(id)) },
        });
    }

    const duplicateCourse = findDuplicateCourse(offerings);
    if (duplicateCourse) {
        throw new AppError(409, "DUPLICATE_KRS_COURSE", "Satu mata kuliah hanya dapat dipilih pada satu kelas.", {
            details: { mataKuliahId: duplicateCourse.mataKuliah.id },
        });
    }

    const conflict = findScheduleConflict(offerings);
    if (conflict) {
        throw new AppError(409, "KRS_SCHEDULE_CONFLICT", "Pilihan KRS memiliki jadwal yang bertabrakan.", {
            details: { ...conflict },
        });
    }
    return offerings;
}

export class StudentKrsService {
    static async getStudentKrsPage(userId: string, tahunAkademikId?: number, now = new Date()) {
        return prisma.$transaction(async (tx) => {
            const context = await getStudentContext(tx, userId);
            const academicYear = await getAcademicYear(tx, tahunAkademikId);
            const [period, krs, offerings] = await Promise.all([
                getKrsPeriod(tx, academicYear.id),
                tx.kRS.findUnique({
                    where: {
                        mahasiswaId_tahunAkademikId: {
                            mahasiswaId: context.mahasiswaId,
                            tahunAkademikId: academicYear.id,
                        },
                    },
                    select: {
                        id: true,
                        status: true,
                        details: {
                            select: {
                                id: true,
                                status: true,
                                kelasMataKuliahId: true,
                                kelasMataKuliah: { select: getOfferingSelect(academicYear.id) },
                            },
                            orderBy: { createdAt: "asc" },
                        },
                    },
                }),
                tx.kelasMataKuliah.findMany({
                    where: {
                        kelas: { prodiId: context.prodiId, tahunAkademikId: academicYear.id },
                    },
                    select: getOfferingSelect(academicYear.id),
                    orderBy: [
                        { mataKuliah: { kode: "asc" } },
                        { kelas: { nama: "asc" } },
                        { id: "asc" },
                    ],
                }),
            ]);

            const selectedIds = new Set(krs?.details.map((detail) => detail.kelasMataKuliahId) ?? []);
            const selectedOfferings = krs?.details.map((detail) => detail.kelasMataKuliah) ?? [];
            const selectedCourseIds = new Set(selectedOfferings.map((offering) => offering.mataKuliah.id));
            const open = isPeriodOpen(period, now);
            const editable = open && isEditableStatus(krs?.status ?? null);
            const selectedConflict = findScheduleConflict(selectedOfferings);
            const selectedDuplicateCourse = findDuplicateCourse(selectedOfferings);
            const selectedCredits = selectedOfferings.reduce((total, offering) => total + offering.mataKuliah.sks, 0);

            const availableCourses = offerings.map((offering) => {
                const selected = selectedIds.has(offering.id);
                let canSelect = editable;
                let unavailableReason: string | null = null;

                if (!open) {
                    canSelect = false;
                    unavailableReason = "KRS_PERIOD_CLOSED";
                } else if (!isEditableStatus(krs?.status ?? null)) {
                    canSelect = false;
                    unavailableReason = "KRS_NOT_EDITABLE";
                } else if (!selected && selectedCourseIds.has(offering.mataKuliah.id)) {
                    canSelect = false;
                    unavailableReason = "COURSE_ALREADY_SELECTED";
                } else if (!selected && findScheduleConflict([...selectedOfferings, offering])) {
                    canSelect = false;
                    unavailableReason = "SCHEDULE_CONFLICT";
                }

                return mapOffering(offering, selected, canSelect, unavailableReason);
            });

            return {
                academicYear,
                krsPeriod: period ? { ...period, isOpen: open } : null,
                krsId: krs?.id ?? null,
                krsStatus: krs?.status ?? null,
                selectedCredits,
                permissions: {
                    canEdit: editable,
                    canSaveDraft: editable,
                    canSubmit: open && krs?.status === StatusKRS.DRAFT && selectedOfferings.length > 0 && selectedConflict === null && selectedDuplicateCourse === null,
                },
                availableCourses,
                selectedKrsCourses: krs?.details.map((detail) => ({
                    krsDetailId: detail.id,
                    status: detail.status,
                    ...mapOffering(detail.kelasMataKuliah, true, editable, editable ? null : open ? "KRS_NOT_EDITABLE" : "KRS_PERIOD_CLOSED"),
                })) ?? [],
            };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    }

    static async saveDraft(userId: string, kelasMataKuliahIds: number[]) {
        await prisma.$transaction(async (tx) => {
            const now = new Date();
            const context = await getStudentContext(tx, userId);
            const academicYear = await getAcademicYear(tx);
            const period = await getKrsPeriod(tx, academicYear.id);
            if (!isPeriodOpen(period, now)) {
                throw new AppError(409, "KRS_PERIOD_CLOSED", "Periode KRS sedang tidak dibuka.");
            }

            const existing = await tx.kRS.findUnique({
                where: {
                    mahasiswaId_tahunAkademikId: {
                        mahasiswaId: context.mahasiswaId,
                        tahunAkademikId: academicYear.id,
                    },
                },
                select: { id: true, status: true },
            });
            if (!isEditableStatus(existing?.status ?? null)) {
                throw new AppError(409, "KRS_NOT_EDITABLE", "KRS yang sudah diajukan atau disetujui tidak dapat diubah.");
            }

            await validateSelection(tx, context, academicYear.id, kelasMataKuliahIds);

            const krs = existing
                ? await tx.kRS.update({ where: { id: existing.id }, data: { status: StatusKRS.DRAFT } })
                : await tx.kRS.create({
                    data: {
                        mahasiswaId: context.mahasiswaId,
                        tahunAkademikId: academicYear.id,
                        status: StatusKRS.DRAFT,
                    },
                });

            await tx.kRSDetail.deleteMany({ where: { krsId: krs.id } });
            if (kelasMataKuliahIds.length > 0) {
                await tx.kRSDetail.createMany({
                    data: kelasMataKuliahIds.map((kelasMataKuliahId) => ({ krsId: krs.id, kelasMataKuliahId })),
                });
            }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        return this.getStudentKrsPage(userId);
    }

    static async submit(userId: string) {
        await prisma.$transaction(async (tx) => {
            const now = new Date();
            const context = await getStudentContext(tx, userId);
            const academicYear = await getAcademicYear(tx);
            const period = await getKrsPeriod(tx, academicYear.id);
            if (!isPeriodOpen(period, now)) {
                throw new AppError(409, "KRS_PERIOD_CLOSED", "Periode KRS sedang tidak dibuka.");
            }

            const krs = await tx.kRS.findUnique({
                where: {
                    mahasiswaId_tahunAkademikId: {
                        mahasiswaId: context.mahasiswaId,
                        tahunAkademikId: academicYear.id,
                    },
                },
                select: {
                    id: true,
                    status: true,
                    details: { select: { kelasMataKuliahId: true } },
                },
            });
            if (!krs) {
                throw new AppError(409, "KRS_DRAFT_NOT_FOUND", "Simpan draf KRS sebelum mengajukannya.");
            }
            if (krs.status !== StatusKRS.DRAFT) {
                throw new AppError(409, "KRS_DRAFT_REQUIRED", "KRS harus disimpan sebagai draf sebelum diajukan.");
            }
            if (krs.details.length === 0) {
                throw new AppError(400, "KRS_EMPTY", "KRS harus memiliki minimal satu kelas mata kuliah sebelum diajukan.");
            }

            await validateSelection(tx, context, academicYear.id, krs.details.map((detail) => detail.kelasMataKuliahId));
            await tx.kRSDetail.updateMany({
                where: { krsId: krs.id },
                data: { status: "MENUNGGU", approvedBy: null, approvedAt: null },
            });
            await tx.kRS.update({ where: { id: krs.id }, data: { status: StatusKRS.DIAJUKAN } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        return this.getStudentKrsPage(userId);
    }
}
