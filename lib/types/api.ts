export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: string;
  issues?: string[];
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;