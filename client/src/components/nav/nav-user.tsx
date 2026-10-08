import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon, LoaderCircleIcon, LogOutIcon, UserRoundIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { getStudentProfile } from "@/api/student-profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutApi } from "@/features/action/authThunk"
import { useAppDispatch } from "@/hooks/redux"
import type { StudentProfileData } from "@/types/student-profile"

export function NavUser({ student = false }: { student?: boolean }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const pending = useRef(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [profile, setProfile] = useState<StudentProfileData | null>(null)

  useEffect(() => {
    if (!student) return
    const controller = new AbortController()
    void getStudentProfile(controller.signal)
      .then(setProfile)
      .catch(() => undefined)
    return () => controller.abort()
  }, [student])

  const studentName = profile?.header.name ?? "Mahasiswa"

  const handleLogout = async () => {
    if (pending.current) return
    pending.current = true
    setIsLoggingOut(true)
    const toastId = toast.loading("Sedang keluar...")
    try {
      await dispatch(logoutApi()).unwrap()
      toast.dismiss(toastId)
      navigate("/", { replace: true })
    } catch (error) {
      toast.error(error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : "Gagal keluar. Silakan coba lagi.", { id: toastId })
    } finally {
      pending.current = false
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "Sedang keluar" : "Buka menu akun"}
        aria-busy={isLoggingOut}
        className="group flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 aria-expanded:bg-muted sm:pr-3"
      >
        <Avatar className="size-8 ring-1 ring-border">
          {profile?.header.avatarUrl && <AvatarImage src={profile.header.avatarUrl} alt={`Foto ${studentName}`} />}
          <AvatarFallback className="bg-primary/10 text-primary">
            {isLoggingOut ? <LoaderCircleIcon className="size-4 animate-spin" /> : <UserRoundIcon className="size-4" />}
          </AvatarFallback>
        </Avatar>
        <span className={`${student ? "max-w-36 truncate" : "hidden sm:block"} text-sm font-medium`}>{isLoggingOut ? "Sedang keluar..." : student ? studentName : "Akun Saya"}</span>
        <ChevronDownIcon aria-hidden="true" className={`${student ? "" : "hidden sm:block"} size-3.5 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-64 max-w-[calc(100vw-2rem)] rounded-xl p-2 shadow-lg">
        {student ? <>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2.5">
              <span className="block truncate text-sm font-semibold text-foreground">{studentName}</span>
              <span className="mt-1 block text-xs font-normal">{profile ? `${profile.header.nim} • Mahasiswa` : "Mahasiswa"}</span>
              {profile && <span className="mt-1 block truncate text-xs font-normal">{profile.header.studyProgram.name}</span>}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link to="/mahasiswa/profil" />} className="min-h-11 cursor-pointer gap-3 rounded-lg px-3">
            <UserRoundIcon />
            Profil Saya
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </> : <>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2.5">
              <span className="block text-sm font-semibold text-foreground">Akun Saya</span>
              <span className="mt-1 block text-xs font-normal">Sistem Informasi Akademik</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>}
        <DropdownMenuItem variant="destructive" disabled={isLoggingOut} onClick={handleLogout} className="min-h-11 cursor-pointer gap-3 rounded-lg px-3">
          <LogOutIcon />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
