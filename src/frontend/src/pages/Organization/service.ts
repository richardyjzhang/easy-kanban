import { request } from 'umi';

export async function fetchAllOrganizations() {
  return request<API.Organization.Organization>('/api/organizations');
}
