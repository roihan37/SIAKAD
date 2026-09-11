export const days = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"]
export const dayLabel = (day: string) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
export const minutes = (value: string) => { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute }

