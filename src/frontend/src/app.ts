// 运行时配置
import { message } from 'antd';
import { AxiosError, history, RequestConfig } from 'umi';

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://next.umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{ name: string }> {
  return { name: '@umijs/max' };
}

// request配置
export const request: RequestConfig = {
  errorConfig: {
    errorHandler(err) {
      switch ((err as AxiosError).response?.status) {
        case 403:
          message.error('禁止访问');
          break;
        case 401:
          message.error('登录失效，请重新登录');
          history.push('/login');
          break;
        default:
          message.error('操作失败');
      }
    },
  },
};

export const layout = () => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
    },
  };
};
