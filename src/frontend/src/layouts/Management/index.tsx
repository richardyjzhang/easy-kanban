import React from 'react';
import { Outlet } from 'umi';
import styles from './index.css';

const ManagementLayout: React.FC = () => {
  return (
    <div>
      <header className={styles.nav}></header>
      <main className={styles.wrapper}>
        <Outlet />
      </main>
    </div>
  );
};

export default ManagementLayout;
