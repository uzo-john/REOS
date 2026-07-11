export class ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;

  constructor(data: T, message = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static error(message: string, statusCode?: number) {
    return {
      success: false,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }
}
