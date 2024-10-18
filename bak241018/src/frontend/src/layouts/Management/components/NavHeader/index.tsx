import ScheduleOutlined from '@ant-design/icons/ScheduleOutlined';
import React from 'react';
import styles from './index.css';

const NavHeader: React.FC = () => {
  return (
    <div className={styles.root}>
      <ScheduleOutlined className={styles.icon} />
      <div className={styles.title}>Easy Kanban</div>
    </div>
  );
};

export default NavHeader;
