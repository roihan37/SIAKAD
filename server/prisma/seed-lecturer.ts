import { Hari } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// Data demo terpisah dari kelas umum agar seed ulang tidak mengubah jadwal dosen lain.
export async function seedFirstLecturer() {
    const user = await prisma.user.findUnique({
        where: { email: "dosen0@siakad.com", role: "Dosen" },
        select: { id: true, dosen: { select: { id: true, prodiId: true } } },
    });
    if (!user?.dosen) throw new Error("Dosen pertama belum tersedia untuk seed jadwal");
    const dosen = user.dosen;
    const tahunAkademik = await prisma.tahunAkademik.findFirst({
        where: { isActive: true },
        orderBy: [{ tahun: "desc" }, { id: "desc" }],
        select: { id: true },
    });
    if (!tahunAkademik) throw new Error("Tahun akademik aktif belum tersedia");

    const courses = await prisma.mataKuliah.findMany({
        where: { kurikulum: { some: { kurikulum: { prodiId: dosen.prodiId, isActive: true } } } },
        orderBy: { kode: "asc" },
        take: 4,
        select: { id: true },
    });
    if (courses.length !== 4) throw new Error("Diperlukan 4 mata kuliah untuk demo dosen pertama");

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: {
                birthPlace: "Bandung",
                birthDate: new Date("1985-05-12T00:00:00.000Z"),
                dosen: { update: { pendidikanTerakhir: "S3", bidangKeahlian: "Basis Data dan Rekayasa Perangkat Lunak" } },
            },
        });
        const ruangan = await tx.ruangan.upsert({
            where: { kode: "DEMO-DOSEN-1" },
            update: {},
            create: { kode: "DEMO-DOSEN-1", nama: "Ruang Demo Dosen 1", kapasitas: 40 },
        });
        const days = [Hari.SENIN, Hari.SELASA, Hari.RABU, Hari.KAMIS];
        for (let classIndex = 0; classIndex < 2; classIndex++) {
            const identity = {
                nama: `Demo Dosen 1-${classIndex === 0 ? "A" : "B"}`,
                prodiId: dosen.prodiId,
                tahunAkademikId: tahunAkademik.id,
            };
            const kelas = await tx.kelas.upsert({
                where: { nama_prodiId_tahunAkademikId: identity },
                update: {},
                create: { ...identity, tingkat: 1 },
            });
            for (const [courseIndex, course] of courses.entries()) {
                const assignment = await tx.kelasMataKuliah.upsert({
                    where: { kelasId_mataKuliahId: { kelasId: kelas.id, mataKuliahId: course.id } },
                    update: { dosenId: dosen.id },
                    create: { kelasId: kelas.id, mataKuliahId: course.id, dosenId: dosen.id },
                });
                // Jadwal tidak memiliki unique key; ganti hanya jadwal kelas demo ini.
                await tx.jadwal.deleteMany({
                    where: { kelasMataKuliahId: assignment.id, tahunAkademikId: tahunAkademik.id },
                });
                await tx.jadwal.create({
                    data: {
                        kelasMataKuliahId: assignment.id,
                        tahunAkademikId: tahunAkademik.id,
                        ruanganId: ruangan.id,
                        hari: days[courseIndex],
                        hariUrutan: courseIndex + 1,
                        jamMulai: classIndex === 0 ? "16:00" : "19:00",
                        jamSelesai: classIndex === 0 ? "18:30" : "21:30",
                    },
                });
            }
        }
    }, { timeout: 30000 });

    return { userId: user.id, tahunAkademikId: tahunAkademik.id };
}
