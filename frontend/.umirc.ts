import { defineConfig } from "umi";

export default defineConfig({
  routes: [{ path: "/", component: "index" }],
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
