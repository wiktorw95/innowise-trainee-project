export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export type AuthResponse = {
  accessToken: string;
  user: User;
};
