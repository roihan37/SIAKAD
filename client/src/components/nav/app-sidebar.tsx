"use client"

import { upcomingPath } from "@/pages/ComingSoon/coming-soon-pages"

import * as React from "react"

import { NavMain } from "@/components/nav/nav-main"
import { NavProjects } from "@/components/nav/nav-projects"
import { SidebarBrand } from "./sidebar-brand"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, LandmarkIcon, CalendarDaysIcon, WalletIcon, Settings2Icon, ChartNoAxesCombinedIcon, GraduationCapIcon, PresentationIcon, Building2Icon, NetworkIcon, BookOpenIcon, DoorOpenIcon, CalendarRangeIcon, LibraryBigIcon, ClipboardListIcon, UserCheckIcon, FileChartColumnIcon, ScrollTextIcon, ReceiptTextIcon, CreditCardIcon, AwardIcon, UsersRoundIcon, ShieldCheckIcon, HistoryIcon, DatabaseBackupIcon, UserRoundIcon, KeyRoundIcon, } from "lucide-react"

// This is sample data.
const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
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
          url: "/mahasiswa",
        },
        {
          title: "Dosen",
          icon: <PresentationIcon />,
          url: "/dosen",
        },
        {
          title: "Fakultas",
          icon: <Building2Icon />,
          url: "/fakultas",
        },
        {
          title: "Program Studi",
          icon: <NetworkIcon />,
          url: "/program-studi",
        },
        {
          title: "Mata Kuliah",
          icon: <BookOpenIcon />,
          url: "/mata-kuliah",
        },
        {
          title: "Ruangan",
          icon: <DoorOpenIcon />,
          url: "/ruangan",
        },
        {
          title: "Tahun Akademik",
          icon: <CalendarRangeIcon />,
          url: "/tahun-akademik",
        },
        {
          title: "Kurikulum",
          icon: <LibraryBigIcon />,
          url: "/kurikulum",
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
          url: "/jadwal-kuliah",
        },
        {
          title: "KRS",
          icon: <ClipboardListIcon />,
          url: "/krs",
        },
        {
          title: "Presensi",
          icon: <UserCheckIcon />,
          url: "/presensi",
        },
        {
          title: "Nilai",
          icon: <FileChartColumnIcon />,
          url: "/nilai",
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
          url: upcomingPath("Tagihan UKT"),
        },
        {
          title: "Pembayaran",
          icon: <CreditCardIcon />,
          url: upcomingPath("Pembayaran"),
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 pb-3">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects profile={data.profile} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
