import { Button, Col, Divider, Form, Input, message, Row } from 'antd';
import { SHA256 } from 'crypto-js';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.css';
import { postLoginRequest } from './service';

const LoginPage: React.FC = () => {
  const { run: login } = useRequest(postLoginRequest, {
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
    if (!values.loginName || !values.password) {
      message.error('请输入用户名或密码');
      return;
    }
    login({
      ...values,
      password: SHA256(`easy-kanban${values.password}`).toString(),
    });
  };

  return (
    <div className={styles.root}>
      <Row className={styles.loginWrapper} justify="end" align="middle">
        <Col>
          <div className={styles.loginCard}>
            <div className={styles.loginTitle}>easy-kanban</div>
            <Divider className={styles.loginDivider} />
            <Form onFinish={onFormFinished}>
              <Form.Item name="loginName">
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="password">
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className={styles.loginBtn}
              >
                登录
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;
