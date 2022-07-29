import { Button } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import { postLoginRequest } from './service';

const LoginPage: React.FC = () => {
  const user: API.Login.LoginUser = {
    loginName: 'FUCK',
    password: 'YOU',
  };

  const [message, setMessage] = useState('');
  const { run: login } = useRequest<API.Login.LoginResult>(postLoginRequest, {
    manual: true,
    onSuccess: (data) => {
      setMessage((data as API.Login.LoginResult).message);
    },
  });

  return (
    <div>
      <Button
        onClick={() => {
          login(user);
        }}
      >
        登录
      </Button>
      <div>{message}</div>
    </div>
  );
};

export default LoginPage;
