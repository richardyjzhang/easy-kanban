import { Menu } from 'antd';
import React from 'react';
import styles from './index.css';

const NavMenu: React.FC = () => {
  return (
    <Menu mode="horizontal" className={styles.root}>
      <Menu.Item className={styles.menuItem} key="kanban">
        看板模式
      </Menu.Item>
      <Menu.Item className={styles.menuItem} key="organization">
        组织管理
      </Menu.Item>
      <Menu.Item className={styles.menuItem} key="user">
        用户管理
      </Menu.Item>
      <Menu.Item className={styles.menuItem} key="project">
        项目管理
      </Menu.Item>
      <Menu.Item className={styles.menuItem} key="worker">
        用户管理
      </Menu.Item>
    </Menu>
  );
};

export default NavMenu;
