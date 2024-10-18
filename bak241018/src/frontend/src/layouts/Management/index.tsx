import React from 'react';
import { Outlet, useModel, useRequest } from 'umi';
import NavFooter from './components/NavFooter';
import NavHeader from './components/NavHeader';
import NavMenu from './components/NavMenu';
import styles from './index.css';
import { _fetchCurrentUser } from './service';

const ManagementLayout: React.FC = () => {
  const { setName } = useModel('global');

  useRequest(_fetchCurrentUser, {
    onSuccess: (data) => {
      const user = data as API.Login.CurrentUser;
      setName(user.nickName ? user.nickName : user.loginName);
    },
  });

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
