import { request } from 'umi';

export async function fetchAllOrganizations() {
  return request<API.Organization.Organization>('/api/organizations');
}

export async function addOneOrganization(
  data: API.Organization.AddOrganization,
) {
  return request<API.Organization.Organization>('/api/organizations', {
    method: 'POST',
    data: data,
  });
}

export async function deleteOneOrganization(id: number) {
  return request(`/api/organizations/${id}`, {
    method: 'DELETE',
  });
}
