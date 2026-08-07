export interface PaginationParams {
    page?: number | 0;
    limit?: number;
    search? : string | '';
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }