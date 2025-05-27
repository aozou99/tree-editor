export interface User {
  id: number;
  name: string;
  icon: string | null;
}

export interface AuthResponse {
  user: User | null;
}
