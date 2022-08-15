import { request } from 'umi';

export async function _fetchAllWorkers() {
  return request<API.Worker.Worker>('/api/workers');
}

export async function _addOneWorker(data: API.Worker.AddWorker) {
  return request<API.Worker.Worker>('/api/workers', {
    method: 'POST',
    data: data,
  });
}

export async function _deleteOneWorker(id: number) {
  return request(`/api/workers/${id}`, {
    method: 'DELETE',
  });
}

export async function _updateOneWorker(data: API.Worker.Worker) {
  return request(`/api/workers/${data.id}`, {
    method: 'PUT',
    data: data,
  });
}
