export interface ApiError {
  code?: string;
  details?: unknown;
  message: string;
  status?: number;
}

export interface MutationInput<T> {
  input: T;
}
