import { useRef, useState } from "react"
import { ChevronDownIcon, LoaderCircleIcon, LogOutIcon, UserRoundIcon } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

export function NavUser() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const pending = useRef(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
      toast.error(typeof error === "string" ? error : "Gagal keluar. Silakan coba lagi.", { id: toastId })
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
          <AvatarFallback className="bg-primary/10 text-primary">
            {isLoggingOut ? <LoaderCircleIcon className="size-4 animate-spin" /> : <UserRoundIcon className="size-4" />}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:block">{isLoggingOut ? "Sedang keluar..." : "Akun Saya"}</span>
        <ChevronDownIcon aria-hidden="true" className="hidden size-3.5 text-muted-foreground transition-transform group-aria-expanded:rotate-180 sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-64 max-w-[calc(100vw-2rem)] rounded-xl p-2 shadow-lg">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2.5">
            <span className="block text-sm font-semibold text-foreground">Akun Saya</span>
            <span className="mt-1 block text-xs font-normal">Sistem Informasi Akademik</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={isLoggingOut} onClick={handleLogout} className="min-h-11 cursor-pointer gap-3 rounded-lg px-3">
          <LogOutIcon />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
