import request from "@/utils/request";

// 登录请求
export async function postLoginRequest(user: API.LoginUser) {
  const response = await request("/api/easy-kanban/login", {
    method: "POST",
    data: user,
  });
  return response;
}
