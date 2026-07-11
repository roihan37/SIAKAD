"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, } from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "MASTER AKADEMIK",
      url: "#",
      icon: (
        <TerminalSquareIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Mahasiswa",
          url: "/mahasiswa",
        },
        {
          title: "Dosen",
          url: "/dosen",
        },
        {
          title: "Fakultas",
          url: "/fakultas",
        },
        {
          title: "Program Studi",
          url: "/program-studi",
        },
        {
          title: "Mata Kuliah",
          url: "/mata-kuliah",
        },
        {
          title: "Ruangan",
          url: "#",
        },
        {
          title: "Tahun Akademik",
          url: "#",
        },
        {
          title: "Kurikulum",
          url: "#",
        },
      ],
    },
    {
      title: "PERKULIAHAN",
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "Jadwal Kuliah",
          url: "#",
        },
        {
          title: "KRS",
          url: "#",
        },
        {
          title: "Presensi",
          url: "#",
        },
        {
          title: "Nilai",
          url: "#",
        },
        {
          title: "Skripsi",
          url: "#",
        },
      ],
    },
    {
      title: "KEUANGAN",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Tagiahan UKT",
          url: "#",
        },
        {
          title: "Pembayaran",
          url: "#",
        },
        {
          title: "Beasiswa",
          url: "#",
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
          url: "#",
        },
        {
          title: "Role & Permission",
          url: "#",
        },
        {
          title: "Log Aktivitas",
          url: "#",
        },
        {
          title: "Backup Database",
          url: "#",
        },
        {
          title: "Pengaturan Sistem",
          url: "#",
        },
      ],
    },
    {
      title: "LAPORAN",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
      items: [
        {
          title: "Data Mahasiswa",
          url: "#",
        },
        {
          title: "Data Dosen",
          url: "#",
        },
        {
          title: "Rekap Nilai",
          url: "#",
        },
        {
          title: "Rekap Presensi",
          url: "#",
        },
        {
          title: "Rekap Pembayaran",
          url: "#",
        },
      ],
    },
  ],
  profile: [
    {
      name: "Profile",
      url: "#",
      icon: (
        <FrameIcon
        />
      ),
    },
    {
      name: "Ubah Password",
      url: "#",
      icon: (
        <PieChartIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects profile={data.profile} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
