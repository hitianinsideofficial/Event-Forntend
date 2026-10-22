export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
  verified?: boolean;
  alreadyCheckedIn?: boolean;
  token?: string;
  error?: string;
  quota?: {
    credits: number;
    totalLimit: number;
    used: number;
    warningAlert: boolean;
    alertMessage?: string;
  };
}

export interface BackendHealthResponse {
  online: boolean;
  data?: any;
  error?: string;
}
