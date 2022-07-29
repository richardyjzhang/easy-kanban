import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  layout: {
    title: 'easy-kanban',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: '登录',
      path: '/login',
      component: './Login',
      hideInMenu: true,
      layout: false,
    },
    {
      path: '/',
      component: '@/layouts/Management',
      layout: false,
      routes: [
        {
          name: '组织管理',
          path: '/organization',
          component: './Organization',
        },
      ],
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
    },
  ],
  npmClient: 'npm',
  history: {
    type: 'hash',
  },
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:9000/',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  request: {
    dataField: '',
  },
});
