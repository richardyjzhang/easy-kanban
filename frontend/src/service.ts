import request from "@/utils/request";

// 登录请求
export async function postLoginRequest(user: API.LoginUser) {
  const response = await request("/api/easy-kanban/login", {
    method: "POST",
    data: user,
  });
  return response;
}

// 获取人员列表
export async function fetchEmployeesRequest() {
  const response = await request("/api/easy-kanban/employees");
  return response;
}

// 新增一个人员
export async function addOneEmployeeRequest(employee: API.Employee) {
  await request("/api/easy-kanban/employees", {
    method: "POST",
    data: employee,
  });
}

// 更新一个人员
export async function updateOneEmployeeRequest(employee: API.Employee) {
  await request(`/api/easy-kanban/employees/${employee.id}`, {
    method: "PUT",
    data: employee,
  });
}

// 删除某个人员
export async function deleteOneEmployeeRequest(id: string) {
  await request(`/api/easy-kanban/employees/${id}`, {
    method: "DELETE",
  });
}

// 获取项目阶段列表
export async function fetchProjectStatusRequest() {
  const response = await request("/api/easy-kanban/project-status");
  return response;
}

// 新增一个项目阶段
export async function addOneProjectStatusRequest(employee: API.Employee) {
  await request("/api/easy-kanban/project-status", {
    method: "POST",
    data: employee,
  });
}

// 更新一个项目阶段
export async function updateOneProjectStatusRequest(employee: API.Employee) {
  await request(`/api/easy-kanban/project-status/${employee.id}`, {
    method: "PUT",
    data: employee,
  });
}

// 删除某个项目阶段
export async function deleteOneProjectStatusRequest(id: string) {
  await request(`/api/easy-kanban/project-status/${id}`, {
    method: "DELETE",
  });
}
