import { request } from 'umi';

export async function _fetchAllProjects() {
  return request<API.Project.Project>('/api/projects');
}

export async function _addOneProject(data: API.Project.AddProject) {
  return request<API.Project.Project>('/api/projects', {
    method: 'POST',
    data: data,
  });
}

export async function _deleteOneProject(id: number) {
  return request(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function _updateOneProject(data: API.Project.Project) {
  return request(`/api/projects/${data.id}`, {
    method: 'PUT',
    data: data,
  });
}
