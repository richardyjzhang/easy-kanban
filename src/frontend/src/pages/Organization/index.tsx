import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import { fetchAllOrganizations } from './service';

const OrganizationPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<
    API.Organization.Organization[]
  >([]);

  // 表格列定义
  const columns: ColumnsType<API.Organization.Organization> = [
    {
      title: '组织ID',
      dataIndex: 'id',
    },
    {
      title: '组织名称',
      dataIndex: 'name',
    },
    {
      title: '备注',
      dataIndex: 'remark',
    },
    {
      title: '操作',
      render: (org) => <div>{org.name}</div>,
    },
  ];

  useRequest(fetchAllOrganizations, {
    onSuccess: (data) => {
      const orgs = data as API.Organization.Organization[];
      setOrganizations(orgs);
    },
  });

  return (
    <div>
      <Table
        columns={columns}
        dataSource={organizations}
        bordered
        rowKey="id"
      />
    </div>
  );
};

export default OrganizationPage;
