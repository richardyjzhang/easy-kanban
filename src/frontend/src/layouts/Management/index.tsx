import React from 'react';
import { Outlet } from 'umi';
import NavMenu from './components/NavMenu';
import styles from './index.css';

const ManagementLayout: React.FC = () => {
  return (
    <div>
      <header className={styles.nav}>
        <div className={styles.navRow}>
          <div className={styles.navHeader}></div>
          <div className={styles.navMenu}>
            <NavMenu />
          </div>
          <div className={styles.navFooter}></div>
        </div>
      </header>
      <main className={styles.wrapper}>
        <Outlet />
      </main>
    </div>
  );
};

export default ManagementLayout;
