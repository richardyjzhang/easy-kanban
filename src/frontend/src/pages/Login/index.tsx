import { Button, Form, Input, message } from 'antd';
import { SHA256 } from 'crypto-js';
import React from 'react';
import { useRequest } from 'umi';
import { postLoginRequest } from './service';

const LoginPage: React.FC = () => {
  const { run: login } = useRequest<API.Login.LoginResult>(postLoginRequest, {
    manual: true,
    onSuccess: (data) => {
      const result = data as API.Login.LoginResult;
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    },
  });

  // 密码加密
  const onFormFinished = (values: API.Login.LoginUser) => {
    login({
      ...values,
      password: SHA256(`easy-kanban${values.password}`).toString(),
    });
  };

  return (
    <div>
      <Form onFinish={onFormFinished}>
        <Form.Item
          label="用户名"
          name="loginName"
          rules={[{ required: true, message: '' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginPage;
