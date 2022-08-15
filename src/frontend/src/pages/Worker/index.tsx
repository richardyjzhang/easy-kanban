import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import { _fetchAllOrganizations } from '../Organization/service';
import styles from './index.css';
import {
  _addOneWorker,
  _deleteOneWorker,
  _fetchAllWorkers,
  _updateOneWorker,
} from './service';

const WorkerPage: React.FC = () => {
  const [workers, setWorkers] = useState<API.Worker.Worker[]>([]);

  // 是否展示新增/编辑弹窗
  const [showModal, setShowModal] = useState(false);

  // 是否为编辑弹窗,否为新增弹窗
  const [editModel, setEditModel] = useState(false);

  // 当前编辑人力
  const [curWorker, setCurWorker] = useState<API.Worker.Worker>({
    id: 0,
    name: '',
    remark: '',
    orgId: 0,
    orgName: '',
  });

  const { data: organizations } = useRequest(_fetchAllOrganizations);

  useRequest(_fetchAllWorkers, {
    onSuccess: (data) => {
      const orgs = data as API.Worker.Worker[];
      setWorkers(orgs);
    },
  });

  const { run: addWorker } = useRequest(_addOneWorker, {
    manual: true,
    onSuccess: (data) => {
      const org = data as API.Worker.Worker;
      setWorkers([...workers, org]);
      message.success('新建成功');
    },
  });

  const { run: deleteWorker, params: _params } = useRequest(_deleteOneWorker, {
    manual: true,
    onSuccess: () => {
      setWorkers(workers.filter((v) => v.id !== _params[0]));
      message.success('删除成功');
    },
  });

  const { run: updateWorker } = useRequest(_updateOneWorker, {
    manual: true,
    onSuccess: (data) => {
      const org = data as API.Worker.Worker;
      const others = workers.filter((v) => v.id !== org.id);
      setWorkers([...others, org]);
    },
  });

  // 表格列定义
  const columns: ColumnsType<API.Worker.Worker> = [
    {
      title: '人力ID',
      dataIndex: 'id',
    },
    {
      title: '人力名称',
      dataIndex: 'name',
    },
    {
      title: '所属组织',
      dataIndex: 'orgName',
    },
    {
      title: '备注',
      dataIndex: 'remark',
    },
    {
      title: '操作',
      render: (org: API.Worker.Worker) => (
        <div>
          <Button
            type="link"
            onClick={() => {
              setCurWorker(org);
              setEditModel(true);
              setShowModal(true);
            }}
            className={styles.editButton}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该人力吗?"
            onConfirm={() => {
              deleteWorker(org.id);
            }}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const onFormFinished = (values: API.Worker.AddWorker) => {
    if (!values.name) {
      message.error('人力名称必填');
      return;
    }

    if (editModel) {
      const org = {
        ...values,
        id: curWorker.id,
        orgId: curWorker.orgId,
        orgName: curWorker.orgName,
      };
      updateWorker(org);
    } else {
      addWorker(values);
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
      title={editModel ? '编辑人力' : '新增人力'}
    >
      <Form
        onFinish={onFormFinished}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        initialValues={editModel ? curWorker : {}}
      >
        <Form.Item name="orgId" label="所属组织">
          <Select disabled={editModel}>
            {(
              organizations as API.Organization.Organization[] | undefined
            )?.map((o) => (
              <Select.Option value={o.id} key={o.id}>
                {o.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="name" label="人力名称">
          <Input placeholder="人力名称" />
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
      <Card title="人力管理">
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
        <Table columns={columns} dataSource={workers} bordered rowKey="id" />
      </Card>
      {model}
    </div>
  );
};

export default WorkerPage;
