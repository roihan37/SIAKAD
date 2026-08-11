export interface PaginationParams {
    page?: number | 0;
    limit?: number;
    search? : string | '';
    sortBy?: string
    sortOrder?: "asc" | "desc"
    prodiId? : number
    fakultasId? : number
  }

  export interface CreateStudentPayload {
    name: string; email: string; username: string; password: string;
    gender: string; phoneNumber: string; address: string; birthDate?: string;
    nim: string; angkatan: number; semester: number; status: string;
    prodiId: number; dosenId: string; avatarKey?: string;
}