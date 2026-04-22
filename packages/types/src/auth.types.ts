export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ISignUpPayload extends ILoginPayload {
  username: string;
  displayName: string;
  birthday: string;
  profileImage?: string;
}

export interface IOAuthCallbackPayload {
  code: string;
  redirect_uri?: string;
  grant_type?: string;
  client_id?: string;
  client_secret?: string;
}
