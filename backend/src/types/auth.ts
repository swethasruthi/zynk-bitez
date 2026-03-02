// Type definitions for authentication requests and responses

// Response format for successful authentication
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: 'customer' | 'chef' | 'delivery' | 'admin';
  };
}

// Request body for user registration
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: 'customer' | 'chef';
  chefBusinessName?: string;
  phone?: string;
}

// Request body for user login
export interface LoginRequest {
  email: string;
  password: string;
}
