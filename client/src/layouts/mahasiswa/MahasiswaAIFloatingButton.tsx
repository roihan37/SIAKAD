import { Sparkles } from "lucide-react"
import { Link, useLocation } from "react-router"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const assistantPath = "/mahasiswa/ai-assistant"

export function MahasiswaAIFloatingButton() {
  const { pathname } = useLocation()

  if (pathname === assistantPath || pathname.startsWith(`${assistantPath}/`)) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={assistantPath}
            aria-label="Buka AI Assistant"
            className={cn(
              buttonVariants({ size: "icon" }),
              "fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 size-[52px] rounded-full shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-4 motion-reduce:transform-none md:right-6 md:bottom-6",
            )}
          >
            <Sparkles className="size-5" aria-hidden="true" />
          </Link>
        }
      />
      <TooltipContent side="left" sideOffset={10} className="hidden md:inline-flex">
        AI Assistant
      </TooltipContent>
    </Tooltip>
  )
}
