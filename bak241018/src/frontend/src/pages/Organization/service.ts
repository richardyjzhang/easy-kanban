import { request } from 'umi';

export async function _fetchAllOrganizations() {
  return request<API.Organization.Organization>('/api/organizations');
}

export async function _addOneOrganization(
  data: API.Organization.AddOrganization,
) {
  return request<API.Organization.Organization>('/api/organizations', {
    method: 'POST',
    data: data,
  });
}

export async function _deleteOneOrganization(id: number) {
  return request(`/api/organizations/${id}`, {
    method: 'DELETE',
  });
}

export async function _updateOneOrganition(
  data: API.Organization.Organization,
) {
  return request(`/api/organizations/${data.id}`, {
    method: 'PUT',
    data: data,
  });
}
