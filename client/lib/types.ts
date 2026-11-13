export interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  deleted: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}
