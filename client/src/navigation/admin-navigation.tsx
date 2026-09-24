import { upcomingPath } from "@/pages/ComingSoon/coming-soon-pages"
import { LayoutDashboardIcon, LandmarkIcon, CalendarDaysIcon, WalletIcon, Settings2Icon, ChartNoAxesCombinedIcon, GraduationCapIcon, PresentationIcon, Building2Icon, NetworkIcon, BookOpenIcon, DoorOpenIcon, CalendarRangeIcon, LibraryBigIcon, ClipboardListIcon, UserCheckIcon, FileChartColumnIcon, ScrollTextIcon, ReceiptTextIcon, CreditCardIcon, AwardIcon, UsersRoundIcon, ShieldCheckIcon, HistoryIcon, DatabaseBackupIcon, UserRoundIcon, KeyRoundIcon, } from "lucide-react"


export const adminNavigation = {
  navMain: [
    { title: "Dashboard", url: "/admin/dashboard", icon: <LayoutDashboardIcon /> },
    {
      title: "MASTER AKADEMIK",
      url: "#",
      icon: (
        <LandmarkIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Mahasiswa",
          icon: <GraduationCapIcon />,
          url: "/admin/mahasiswa",
        },
        {
          title: "Dosen",
          icon: <PresentationIcon />,
          url: "/admin/dosen",
        },
        {
          title: "Fakultas",
          icon: <Building2Icon />,
          url: "/admin/fakultas",
        },
        {
          title: "Program Studi",
          icon: <NetworkIcon />,
          url: "/admin/program-studi",
        },
        {
          title: "Mata Kuliah",
          icon: <BookOpenIcon />,
          url: "/admin/mata-kuliah",
        },
        {
          title: "Ruangan",
          icon: <DoorOpenIcon />,
          url: "/admin/ruangan",
        },
        {
          title: "Tahun Akademik",
          icon: <CalendarRangeIcon />,
          url: "/admin/tahun-akademik",
        },
        {
          title: "Kurikulum",
          icon: <LibraryBigIcon />,
          url: "/admin/kurikulum",
        },
      ],
    },
    {
      title: "PERKULIAHAN",
      url: "#",
      icon: (
        <CalendarDaysIcon
        />
      ),
      items: [
        {
          title: "Jadwal Kuliah",
          icon: <CalendarDaysIcon />,
          url: "/admin/jadwal-kuliah",
        },
        {
          title: "KRS",
          icon: <ClipboardListIcon />,
          url: "/admin/krs",
        },
        {
          title: "Presensi",
          icon: <UserCheckIcon />,
          url: "/admin/presensi",
        },
        {
          title: "Nilai",
          icon: <FileChartColumnIcon />,
          url: "/admin/nilai",
        },
        {
          title: "Skripsi",
          icon: <ScrollTextIcon />,
          url: upcomingPath("Skripsi"),
        },
      ],
    },
    {
      title: "KEUANGAN",
      url: "#",
      icon: (
        <WalletIcon
        />
      ),
      items: [
        {
          title: "Tagihan UKT",
          icon: <ReceiptTextIcon />,
          url: "/admin/tagihan-ukt",
        },
        {
          title: "Pembayaran",
          icon: <CreditCardIcon />,
          url: "/admin/pembayaran",
        },
        {
          title: "Beasiswa",
          icon: <AwardIcon />,
          url: upcomingPath("Beasiswa"),
        },
      ],
    },
    {
      title: "PENGUMUMAN",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
      items: [
        {
          title: "Manajemen User",
          icon: <UsersRoundIcon />,
          url: upcomingPath("Manajemen User"),
        },
        {
          title: "Role & Permission",
          icon: <ShieldCheckIcon />,
          url: upcomingPath("Role & Permission"),
        },
        {
          title: "Log Aktivitas",
          icon: <HistoryIcon />,
          url: upcomingPath("Log Aktivitas"),
        },
        {
          title: "Backup Database",
          icon: <DatabaseBackupIcon />,
          url: upcomingPath("Backup Database"),
        },
        {
          title: "Pengaturan Sistem",
          icon: <Settings2Icon />,
          url: upcomingPath("Pengaturan Sistem"),
        },
      ],
    },
    {
      title: "LAPORAN",
      url: "#",
      icon: (
        <ChartNoAxesCombinedIcon
        />
      ),
      items: [
        {
          title: "Data Mahasiswa",
          icon: <GraduationCapIcon />,
          url: upcomingPath("Data Mahasiswa"),
        },
        {
          title: "Data Dosen",
          icon: <PresentationIcon />,
          url: upcomingPath("Data Dosen"),
        },
        {
          title: "Rekap Nilai",
          icon: <FileChartColumnIcon />,
          url: upcomingPath("Rekap Nilai"),
        },
        {
          title: "Rekap Presensi",
          icon: <UserCheckIcon />,
          url: upcomingPath("Rekap Presensi"),
        },
        {
          title: "Rekap Pembayaran",
          icon: <ReceiptTextIcon />,
          url: upcomingPath("Rekap Pembayaran"),
        },
      ],
    },
  ],
  profile: [
    {
      name: "Profile",
      url: upcomingPath("Profile"),
      icon: (
        <UserRoundIcon
        />
      ),
    },
    {
      name: "Ubah Password",
      url: upcomingPath("Ubah Password"),
      icon: (
        <KeyRoundIcon
        />
      ),
    },
  ],
}

