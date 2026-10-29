import { LayoutDashboard, ClipboardList, CalendarDays, GraduationCap, UserCheck, FileChartColumn, Wallet, ReceiptText, Megaphone, Sparkles, UserRound, KeyRound, Settings, BookOpen, UsersRound, ShieldCheck } from "lucide-react"
import type { NavigationIcon } from "./types"

export const navigationIcons = { dashboard: LayoutDashboard, krs: ClipboardList, calendar: CalendarDays, graduation: GraduationCap, attendance: UserCheck, transcript: FileChartColumn, wallet: Wallet, receipt: ReceiptText, announcement: Megaphone, sparkles: Sparkles, profile: UserRound, password: KeyRound, settings: Settings, course: BookOpen, advisees: UsersRound, approval: ShieldCheck } satisfies Record<NavigationIcon, typeof LayoutDashboard>
