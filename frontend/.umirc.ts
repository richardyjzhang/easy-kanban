import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    {
      path: "/",
      redirect: "/kanban",
    },
    {
      name: "登录",
      path: "/login",
      component: "./login",
      hideInMenu: true,
      layout: false,
    },
    {
      path: "/",
      component: "@/layouts",
      layout: false,
      routes: [
        {
          name: "人力管理",
          path: "/employee-management",
          component: "./employee-management",
        },
      ],
    },
  ],
  history: {
    type: "hash",
  },
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  proxy: {
    "/api/easy-kanban": {
      target: "http://127.0.0.1:5000/",
      changeOrigin: true,
      pathRewrite: { "^/api/easy-kanban": "" },
    },
  },
  npmClient: "yarn",
});
