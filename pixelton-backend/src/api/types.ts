export interface BasicApiRequest {
  method: string;
  auth_token?: string;
}

export interface BasicApiError {
  text: string;
}

export interface BasicApiResponse<T = any> {
  success: boolean;
  error?: BasicApiError;
  data?: T;
}
