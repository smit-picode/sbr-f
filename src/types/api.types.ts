export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SelectOption {
  label: string;
  value: string;
}
