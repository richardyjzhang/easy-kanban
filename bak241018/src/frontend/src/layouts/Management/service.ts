import { request } from 'umi';

export async function _fetchCurrentUser() {
  return request<API.Login.LoginResult>('/api/users/current');
}
