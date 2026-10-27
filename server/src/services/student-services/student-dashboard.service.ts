import { StudentAcademicService } from "./student-academic.service";
import { StudentAttendanceService } from "./student-attendance.service";
import { StudentFinanceService } from "./student-finance.service";
import { StudentProfileService } from "./student-profile.service";
import { StudentScheduleService } from "./student-schedule.service";

export class StudentDashboardService {
    static async getMyDashboard(userId: string) {
        const [profile, schedule, attendance, transcript, tuition] = await Promise.all([
            StudentProfileService.getProfile(userId),
            StudentScheduleService.getMySchedule(userId),
            StudentAttendanceService.getMyAttendance(userId),
            StudentAcademicService.getMyTranscript(userId),
            StudentFinanceService.getMyUKT(userId),
        ]);
        const { krs } = await StudentAcademicService.getStudentKRS(userId, schedule.academicYear.id);

        return {
            student: {
                name: profile.header.name,
                studyProgram: profile.header.studyProgram,
                semester: profile.academic.semester,
                status: profile.academic.status,
            },
            academicYear: schedule.academicYear,
            summary: {
                cumulativeGpa: transcript.cumulativeGpa,
                completedCredits: transcript.completedCredits,
                attendancePercentage: attendance.summary.attendancePercentage,
            },
            krs: {
                status: krs?.status ?? null,
                selectedCredits: krs?.totalSKS ?? 0,
            },
            schedules: schedule.schedules,
            attendanceCourses: attendance.courses,
            tuition: tuition.bills[0] ?? null,
        };
    }
}
