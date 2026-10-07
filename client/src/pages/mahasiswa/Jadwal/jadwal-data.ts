export type ScheduleDay = "senin" | "selasa" | "rabu" | "kamis" | "jumat" | "sabtu" | "minggu"

export type CourseSchedule = {
  id: string
  day: ScheduleDay
  startTime: string
  endTime: string
  courseCode: string
  courseName: string
  credits: number
  className: string
  room: string
  lecturer: string
  meeting: number
  deliveryMode: "Tatap Muka" | "Daring"
  conflictWith?: string
}

export const scheduleProfile = {
  academicYear: "2026/2027 Ganjil",
  semester: 7,
}

export const scheduleDays: Array<{ key: ScheduleDay; shortLabel: string; label: string }> = [
  { key: "senin", shortLabel: "Sen", label: "Senin" },
  { key: "selasa", shortLabel: "Sel", label: "Selasa" },
  { key: "rabu", shortLabel: "Rab", label: "Rabu" },
  { key: "kamis", shortLabel: "Kam", label: "Kamis" },
  { key: "jumat", shortLabel: "Jum", label: "Jumat" },
  { key: "sabtu", shortLabel: "Sab", label: "Sabtu" },
  { key: "minggu", shortLabel: "Min", label: "Minggu" },
]

export const courseSchedules: CourseSchedule[] = [
  {
    id: "schedule-if301",
    day: "senin",
    startTime: "08.00",
    endTime: "10.30",
    courseCode: "IF301",
    courseName: "Rekayasa Perangkat Lunak",
    credits: 3,
    className: "A",
    room: "Lab Komputasi 2",
    lecturer: "Dr. Rina Kurniawati, M.Kom.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
    conflictWith: "IF313 Manajemen Proyek TI",
  },
  {
    id: "schedule-if313",
    day: "senin",
    startTime: "08.00",
    endTime: "10.30",
    courseCode: "IF313",
    courseName: "Manajemen Proyek TI",
    credits: 3,
    className: "B",
    room: "R. 2.10",
    lecturer: "Reza Mahendra, M.MSI.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
    conflictWith: "IF301 Rekayasa Perangkat Lunak",
  },
  {
    id: "schedule-if303",
    day: "selasa",
    startTime: "10.30",
    endTime: "13.00",
    courseCode: "IF303",
    courseName: "Kecerdasan Buatan",
    credits: 3,
    className: "B",
    room: "R. 4.12",
    lecturer: "Andi Pratama, M.Cs.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
  },
  {
    id: "schedule-if317",
    day: "selasa",
    startTime: "14.00",
    endTime: "16.30",
    courseCode: "IF317",
    courseName: "Pengembangan Aplikasi Bergerak",
    credits: 3,
    className: "A",
    room: "Lab Komputasi 3",
    lecturer: "Ayu Permata, M.Kom.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
  },
  {
    id: "schedule-if319",
    day: "rabu",
    startTime: "08.00",
    endTime: "10.30",
    courseCode: "IF319",
    courseName: "Analitik Big Data",
    credits: 3,
    className: "B",
    room: "Lab Data",
    lecturer: "Dr. Yoga Prasetyo, M.Kom.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
  },
  {
    id: "schedule-if305",
    day: "rabu",
    startTime: "13.00",
    endTime: "15.30",
    courseCode: "IF305",
    courseName: "Jaringan Komputer Lanjut",
    credits: 3,
    className: "A",
    room: "Lab Jaringan",
    lecturer: "Dimas Saputra, M.Kom.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
  },
  {
    id: "schedule-if307",
    day: "kamis",
    startTime: "08.00",
    endTime: "10.30",
    courseCode: "IF307",
    courseName: "Interaksi Manusia dan Komputer",
    credits: 3,
    className: "C",
    room: "R. 3.08",
    lecturer: "Nadia Putri, M.Ds.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
  },
  {
    id: "schedule-if309",
    day: "jumat",
    startTime: "08.00",
    endTime: "10.30",
    courseCode: "IF309",
    courseName: "Komputasi Awan",
    credits: 3,
    className: "A",
    room: "Google Meet",
    lecturer: "Fajar Nugroho, M.Kom.",
    meeting: 6,
    deliveryMode: "Daring",
  },
  {
    id: "schedule-if311",
    day: "jumat",
    startTime: "13.00",
    endTime: "15.30",
    courseCode: "IF311",
    courseName: "Data Mining",
    credits: 3,
    className: "B",
    room: "R. 4.05",
    lecturer: "Dr. Maya Lestari, M.Kom.",
    meeting: 6,
    deliveryMode: "Tatap Muka",
  },
]
