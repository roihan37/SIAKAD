import { seedAssessment, seedGrade } from "./grades";
import { seedStudentFinance } from "./finance";
import { seedAttendance } from "./attendance";
import { Gender, JabatanDosen, KRSStatus, Pendidikan, Role, Status, StatusKRS } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/lib/bycript";
import { countScheduleConflicts } from "../../src/services/dashboard.service";
import { programs, periods, statuses, days } from "./catalog";
import { resetDatabase } from "./reset";

export async function seedCampus(reset = false) {
  const password = hashPassword(process.env.SEED_PASSWORD || "Tasik123");
  return prisma.$transaction(async (tx) => {
    if (reset) await resetDatabase(tx);
    const admin = { name: "Ratna Puspita", email: "admin@siakad.com", username: "admin", password, role: Role.Admin, gender: Gender.Female, address: "Tasikmalaya" };
    const adminUser = await tx.user.upsert({ where: { email: admin.email }, update: admin, create: admin });
    // Snapshot demo ini memiliki tepat satu periode akademik aktif.
    await tx.tahunAkademik.updateMany({ where: { isActive: true }, data: { isActive: false } });
    await tx.periodeKRS.updateMany({ where: { isActive: true }, data: { isActive: false } });
    const years = [];
    for (const period of periods) {
      const identity = { tahun: period.tahun, semester: period.semester };
      const year = await tx.tahunAkademik.upsert({ where: { tahun_semester: identity }, update: { isActive: period.isActive }, create: { ...identity, isActive: period.isActive } });
      years.push(year);
      // PeriodeKRS belum memiliki unique key tahunAkademikId.
      await tx.periodeKRS.deleteMany({ where: { tahunAkademikId: year.id } });
      await tx.periodeKRS.create({ data: { tahunAkademikId: year.id, mulai: new Date(`${period.start}T00:00:00+07:00`), selesai: new Date(`${period.end}T23:59:59+07:00`), isActive: period.isActive } });
    }
    const attendanceScheduleIds: number[] = [];
    const photoTargets: { userId: string; entity: "students" | "lecturers" }[] = [];
    for (const [p, definition] of programs.entries()) {
      const faculty = await tx.fakultas.upsert({ where: { kode: definition.facultyCode }, update: { name: definition.faculty }, create: { kode: definition.facultyCode, name: definition.faculty } });
      const prodiData = { name: definition.name, fakultasId: faculty.id };
      const prodi = await tx.prodi.upsert({ where: { kode: definition.code }, update: prodiData, create: { kode: definition.code, ...prodiData } });
      const lecturers = [];
      for (const [i, name] of definition.lecturers.entries()) {
        const index = p * 3 + i;
        const profile = { name, email: `dosen${index}@siakad.com`, username: `dosen${index}`, password, role: Role.Dosen, gender: i === 1 ? Gender.Female : Gender.Male, birthPlace: "Bandung", birthDate: new Date(`198${i + 2}-05-12T00:00:00Z`), phoneNumber: `0812000001${index.toString().padStart(2, "0")}`, address: `Jl. Siliwangi No. ${10 + index}, Tasikmalaya` };
        const user = await tx.user.upsert({ where: { email: profile.email }, update: profile, create: profile });
        const detail = { nidn: `0412058${index.toString().padStart(3, "0")}`, status: Status.Aktif, jabatan: i === 0 ? JabatanDosen.Kaprodi : JabatanDosen.Dosen, pendidikanTerakhir: i === 0 ? Pendidikan.S3 : Pendidikan.S2, bidangKeahlian: definition.expertise[i], prodiId: prodi.id };
        lecturers.push(await tx.dosen.upsert({ where: { userId: user.id }, update: detail, create: { userId: user.id, ...detail } }));
        if (index === 0) photoTargets.push({ userId: user.id, entity: "lecturers" });
      }
      const room = await tx.ruangan.upsert({ where: { kode: `${definition.code}-201` }, update: {}, create: { kode: `${definition.code}-201`, nama: `Ruang ${definition.code} 201`, kapasitas: 30, gedung: p === 0 ? "Gedung Teknik" : "Gedung Ekonomi" } });
      const curriculumData = { kode: `${definition.code}-2025`, nama: `Kurikulum ${definition.name} 2025`, isActive: true };
      const curriculum = await tx.kurikulum.upsert({ where: { prodiId_tahun: { prodiId: prodi.id, tahun: 2025 } }, update: curriculumData, create: { ...curriculumData, prodiId: prodi.id, tahun: 2025 } });
      const classesByPeriod = [];
      for (const [periodIndex, year] of years.entries()) {
        const names = periodIndex === 0 ? definition.previous : definition.current;
        const identity = { nama: `${definition.code}-${periods[periodIndex].level}A`, prodiId: prodi.id, tahunAkademikId: year.id };
        const kelas = await tx.kelas.upsert({ where: { nama_prodiId_tahunAkademikId: identity }, update: { tingkat: periodIndex + 1 }, create: { ...identity, tingkat: periodIndex + 1 } });
        const assignments = [];
        for (const [i, nama] of names.entries()) {
          const kode = `${definition.code}${periods[periodIndex].level}0${i + 1}`;
          const course = await tx.mataKuliah.upsert({ where: { kode }, update: { nama, sks: 3 }, create: { kode, nama, sks: 3 } });
          await tx.kurikulumMataKuliah.upsert({ where: { kurikulumId_mataKuliahId: { kurikulumId: curriculum.id, mataKuliahId: course.id } }, update: { semester: periods[periodIndex].level, wajib: true }, create: { kurikulumId: curriculum.id, mataKuliahId: course.id, semester: periods[periodIndex].level, wajib: true } });
          const assignment = await tx.kelasMataKuliah.upsert({ where: { kelasId_mataKuliahId: { kelasId: kelas.id, mataKuliahId: course.id } }, update: { dosenId: lecturers[i % 3].id }, create: { kelasId: kelas.id, mataKuliahId: course.id, dosenId: lecturers[i % 3].id } });
          assignments.push(assignment);
          await tx.jadwal.deleteMany({ where: { kelasMataKuliahId: assignment.id } });
          const schedule = await tx.jadwal.create({ data: { kelasMataKuliahId: assignment.id, tahunAkademikId: year.id, ruanganId: room.id, hari: days[Math.floor(i / 2)], hariUrutan: Math.floor(i / 2) + 1, jamMulai: i % 2 === 0 ? "08:00" : "10:45", jamSelesai: i % 2 === 0 ? "10:30" : "13:15" } });
          if (i < 2) attendanceScheduleIds.push(schedule.id);
        }
        classesByPeriod.push(assignments);
      }
      for (const [i, name] of definition.students.entries()) {
        const index = p * 8 + i;
        const nim = `2025${p + 1}${(i + 1).toString().padStart(3, "0")}`;
        const profile = { name, email: `mahasiswa${index}@student.com`, username: `mahasiswa${index}`, password, role: Role.Mahasiswa, gender: i % 2 === 0 ? Gender.Male : Gender.Female, birthPlace: "Tasikmalaya", birthDate: new Date(`2006-04-${(i + 10).toString()}T00:00:00Z`), phoneNumber: `08130000${index.toString().padStart(4, "0")}`, address: `Jl. Merdeka No. ${index + 1}, Tasikmalaya` };
        const user = await tx.user.upsert({ where: { email: profile.email }, update: profile, create: profile });
        const advisor = lecturers[i % 3];
        const studentData = { nim, angkatan: 2025, semester: 3, status: i === 7 ? Status.Cuti : Status.Aktif, prodiId: prodi.id, dosenId: advisor.id };
        const student = await tx.mahasiswa.upsert({ where: { userId: user.id }, update: studentData, create: { userId: user.id, ...studentData } });
        await seedStudentFinance(tx, student, years, p, i, adminUser.id);
        if (index === 0) photoTargets.push({ userId: user.id, entity: "students" });
        await tx.riwayatStatusMahasiswa.deleteMany({ where: { mahasiswaId: student.id, alasan: { startsWith: "[Seed]" } } });
        await tx.riwayatStatusMahasiswa.create({ data: { mahasiswaId: student.id, statusLama: i === 7 ? Status.Aktif : null, statusBaru: student.status, alasan: i === 7 ? "[Seed] Cuti satu semester atas permohonan mahasiswa." : "[Seed] Registrasi ulang semester ganjil 2026/2027.", tanggal: new Date("2026-09-01T08:00:00+07:00") } });
        for (const [periodIndex, year] of years.entries()) {
          // Bangun ulang hanya KRS mahasiswa seed pada dua periode demo.
          const old = await tx.kRS.findUnique({ where: { mahasiswaId_tahunAkademikId: { mahasiswaId: student.id, tahunAkademikId: year.id } } });
          if (old) {
            await tx.transkrip.deleteMany({ where: { krsDetail: { krsId: old.id } } });
            await tx.kRSDetail.deleteMany({ where: { krsId: old.id } });
          }
          if (periodIndex === 1 && i >= 6) { if (old) await tx.kRS.delete({ where: { id: old.id } }); continue; }
          const status = periodIndex === 0 ? StatusKRS.DISETUJUI : statuses[i];
          const krs = await tx.kRS.upsert({ where: { mahasiswaId_tahunAkademikId: { mahasiswaId: student.id, tahunAkademikId: year.id } }, update: { status }, create: { mahasiswaId: student.id, tahunAkademikId: year.id, status } });
          for (const [courseIndex, assignment] of classesByPeriod[periodIndex].entries()) {
            const approved = status === StatusKRS.DISETUJUI;
            const detail = await tx.kRSDetail.create({ data: { krsId: krs.id, kelasMataKuliahId: assignment.id, status: approved ? KRSStatus.DISETUJUI : status === StatusKRS.DITOLAK ? KRSStatus.DITOLAK : KRSStatus.MENUNGGU, approvedBy: approved ? advisor.userId : null, approvedAt: approved ? new Date(`${periods[periodIndex].approval}T09:00:00+07:00`) : null } });
            if (approved && (periodIndex === 0 || courseIndex < 4)) await seedAssessment(tx, detail.id, index, courseIndex, periodIndex, adminUser.id);
            // Semester aktif: tiga mata kuliah bernilai sebagai simulasi UI.
            if (approved && (periodIndex === 0 || courseIndex < 3)) {
              const grade = seedGrade(index, courseIndex, periodIndex);
              await tx.transkrip.create({ data: { mahasiswaId: student.id, krsDetailId: detail.id, nilaiAngka: grade.score, nilaiHuruf: grade.letter, bobot: grade.weight } });
            }
          }
        }
      }
    }
    const schedules = await tx.jadwal.findMany({ where: { tahunAkademikId: { in: years.map((year) => year.id) } }, include: { kelasMataKuliah: true } });
    for (const year of years) if (countScheduleConflicts(schedules.filter((s) => s.tahunAkademikId === year.id))) throw new Error("Seed dibatalkan: terdapat jadwal bentrok; gunakan database demo bersih.");
    await seedAttendance(tx, attendanceScheduleIds);
    return photoTargets;
  }, { timeout: 120000, maxWait: 10000 });
}
