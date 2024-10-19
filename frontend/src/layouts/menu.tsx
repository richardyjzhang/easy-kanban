import React from "react";
import { Menu } from "antd";
import { useLocation, history } from "umi";
import styles from "./index.css";

const MyMenu: React.FC = () => {
  const location = useLocation();

  return (
    <Menu
      className={styles.menu}
      mode="inline"
      style={{
        marginTop: "1rem",
      }}
      selectedKeys={[location.pathname]}
      onClick={({ key }) => {
        history.push(key);
      }}
      items={[
        {
          key: "/kanban",
          label: "智能看板",
        },
        {
          key: "/biz-management",
          label: "后台管理",
          children: [
            {
              key: "/employee-management",
              label: "人力管理",
            },
          ],
        },
        {
          key: "/system-management",
          label: "系统管理",
          children: [],
        },
      ]}
    />
  );
};

export default MyMenu;
