import { Button } from 'antd';
import React from 'react';
import { request, useRequest } from 'umi';

const LoginPage: React.FC = () => {
  const { data, run: login } = useRequest(
    () => {
      return request('/api/login', {
        method: 'POST',
        data: {
          loginName: 'FUCK',
          password: 'YOU',
        },
      });
    },
    { manual: true },
  );

  return (
    <div>
      <Button onClick={login}>登录</Button>
      <div>{data?.message}</div>
    </div>
  );
};

export default LoginPage;
