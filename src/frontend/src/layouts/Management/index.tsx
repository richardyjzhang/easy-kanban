import React from 'react';
import { Outlet } from 'umi';
import NavFooter from './components/NavFooter';
import NavHeader from './components/NavHeader';
import NavMenu from './components/NavMenu';
import styles from './index.css';

const ManagementLayout: React.FC = () => {
  return (
    <div>
      <header className={styles.nav}>
        <div className={styles.navRow}>
          <div className={styles.navHeader}>
            <NavHeader />
          </div>
          <div className={styles.navMenu}>
            <NavMenu />
          </div>
          <div className={styles.navFooter}>
            <NavFooter />
          </div>
        </div>
      </header>
      <main className={styles.wrapper}>
        <Outlet />
      </main>
    </div>
  );
};

export default ManagementLayout;
