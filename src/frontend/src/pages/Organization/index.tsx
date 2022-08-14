import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.css';
import {
  _addOneOrganization,
  _deleteOneOrganization,
  _fetchAllOrganizations,
  _updateOneOrganition,
} from './service';

const OrganizationPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<
    API.Organization.Organization[]
  >([]);

  // 是否展示新增/编辑弹窗
  const [showModal, setShowModal] = useState(false);

  // 是否为编辑弹窗,否为新增弹窗
  const [editModel, setEditModel] = useState(false);

  // 当前编辑组织
  const [curOrganization, setCurOrganization] =
    useState<API.Organization.Organization>({
      id: 0,
      name: '',
      remark: '',
    });

  useRequest(_fetchAllOrganizations, {
    onSuccess: (data) => {
      const orgs = data as API.Organization.Organization[];
      setOrganizations(orgs);
    },
  });

  const { run: addOrganization } = useRequest(_addOneOrganization, {
    manual: true,
    onSuccess: (data) => {
      const org = data as API.Organization.Organization;
      setOrganizations([...organizations, org]);
      message.success('新建成功');
    },
  });

  const { run: deleteOrganization, params: _params } = useRequest(
    _deleteOneOrganization,
    {
      manual: true,
      onSuccess: () => {
        setOrganizations(organizations.filter((v) => v.id !== _params[0]));
        message.success('删除成功');
      },
    },
  );

  const { run: updateOrganization } = useRequest(_updateOneOrganition, {
    manual: true,
    onSuccess: (data) => {
      const org = data as API.Organization.Organization;
      const others = organizations.filter((v) => v.id !== org.id);
      setOrganizations([...others, org]);
    },
  });

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
      render: (org: API.Organization.Organization) => (
        <div>
          <Button
            type="link"
            onClick={() => {
              setCurOrganization(org);
              setEditModel(true);
              setShowModal(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => {
              deleteOrganization(org.id);
            }}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  const onFormFinished = (values: API.Organization.AddOrganization) => {
    if (!values.name) {
      message.error('组织名称必填');
      return;
    }

    if (editModel) {
      const org = { ...values, id: curOrganization.id };
      updateOrganization(org);
    } else {
      addOrganization(values);
    }
    setShowModal(false);
  };

  // 编辑/新增弹窗
  const model = (
    <Modal
      visible={showModal}
      footer={null}
      maskClosable={false}
      closable={false}
      onCancel={() => {
        setShowModal(false);
      }}
      destroyOnClose
      width={600}
      title={editModel ? '编辑组织' : '新增组织'}
    >
      <Form
        onFinish={onFormFinished}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        initialValues={editModel ? curOrganization : {}}
      >
        <Form.Item name="name" label="组织名称">
          <Input placeholder="组织名称" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input placeholder="备注" />
        </Form.Item>
        <Divider />
        <div className={styles.modalFooter}>
          <Button
            type="default"
            className={styles.modalCancel}
            onClick={() => {
              setShowModal(false);
            }}
          >
            取消
          </Button>
          <Button type="primary" htmlType="submit" className={styles.modalOk}>
            确认
          </Button>
        </div>
      </Form>
    </Modal>
  );

  return (
    <div>
      <Card title="组织管理">
        <div className={styles.addRow}>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => {
              setEditModel(false);
              setShowModal(true);
            }}
          >
            新建
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={organizations}
          bordered
          rowKey="id"
        />
      </Card>
      {model}
    </div>
  );
};

export default OrganizationPage;
