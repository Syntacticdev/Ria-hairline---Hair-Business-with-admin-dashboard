interface ApiResponseOptions {
  status?: 'success' | 'error' | 'fail';
}

export class ApiResponse<T> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data?: T;

  constructor(statusCode: number, message: string, data?: T, options?: ApiResponseOptions) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = options?.status !== 'error' && options?.status !== 'fail';
    this.data = data;
  }
}

export const sendSuccess = <T>(res: { status: (code: number) => { json: (body: unknown) => void } }, statusCode: number, message: string, data?: T): void => {
  res.status(statusCode).json(new ApiResponse<T>(statusCode, message, data));
};