// src/components/krs/KRSSummary.tsx

import {
  Users,
  ClipboardCheck,
  Clock3,
  ClipboardX,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

export interface KRSSummaryData {
  totalMahasiswa: number
  krsSelesai: number
  menunggu: number
  belumKRS: number
}

interface KRSSummaryProps {
  data: KRSSummaryData
}

export function KRSSummary({
  data,
}: KRSSummaryProps) {
  const summaryItems = [
    {
      label: "Total Mahasiswa",
      value: data.totalMahasiswa,
      icon: Users,
    },
    {
      label: "KRS Selesai",
      value: data.krsSelesai,
      icon: ClipboardCheck,
    },
    {
      label: "Menunggu",
      value: data.menunggu,
      icon: Clock3,
    },
    {
      label: "Belum KRS",
      value: data.belumKRS,
      icon: ClipboardX,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {summaryItems.map((item) => {
        const Icon = item.icon

        return (
          <Card
            key={item.label}
            className="shadow-none"
          >
            <CardContent className="flex items-center gap-3 p-4">
              
              {/* Icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                  {item.label}
                </p>

                <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {item.value.toLocaleString("id-ID")}
                </p>
              </div>

            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}