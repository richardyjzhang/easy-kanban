import { UserOutlined } from '@ant-design/icons';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.css';

const NavFooter: React.FC = () => {
  const { name } = useModel('global');
  return (
    <div className={styles.root}>
      <div className={styles.title}>{name}</div>
      <UserOutlined className={styles.icon} />
    </div>
  );
};

export default NavFooter;
