import request from "@/utils/request";

export async function postLogoutRequest() {
  const response = await request("/api/easy-kanban/logout", {
    method: "POST",
  });
  return response;
}
