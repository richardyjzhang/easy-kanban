import { request } from 'umi';

export async function postLoginRequest(user: API.Login.LoginUser) {
  return request<API.Login.LoginResult>('/api/login', {
    method: 'POST',
    data: user,
  });
}
