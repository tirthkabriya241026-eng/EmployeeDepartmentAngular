export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
  };
  message: string;
}