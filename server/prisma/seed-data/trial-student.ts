import { Gender, Prisma, Role, Status } from '@prisma/client';
import { hashPassword } from '../../src/lib/bycript';
import { newPassword } from '../../src/auth/validation';

export async function seedTrialStudent(tx: Prisma.TransactionClient, prodiId: number, dosenId: string) {
  const password = newPassword(process.env.SEED_TRIAL_PASSWORD || 'TrialSIAKAD123!');
  const profile = {
    name: 'Mahasiswa Trial', email: 'mahasiswa.trial@example.test', username: 'mahasiswa_trial',
    password: hashPassword(password), role: Role.Mahasiswa, gender: Gender.Male,
    mustChangePassword: true,
  };
  // Reset this dedicated demo account and revoke old sessions on every seed run.
  const user = await tx.user.upsert({ where: { email: profile.email }, update: profile, create: profile });
  await tx.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } });
  const student = { nim: '20251999', angkatan: 2025, semester: 3, status: Status.Aktif, prodiId, dosenId };
  await tx.mahasiswa.upsert({ where: { userId: user.id }, update: student, create: { userId: user.id, ...student } });
}
