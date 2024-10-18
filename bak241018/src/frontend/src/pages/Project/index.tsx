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
  _addOneProject,
  _deleteOneProject,
  _fetchAllProjects,
  _updateOneProject,
} from './service';

const ProjectPage: React.FC = () => {
  const [projects, setProjects] = useState<API.Project.Project[]>([]);

  // 是否展示新增/编辑弹窗
  const [showModal, setShowModal] = useState(false);

  // 是否为编辑弹窗,否为新增弹窗
  const [editModel, setEditModel] = useState(false);

  // 当前编辑项目
  const [curProject, setCurProject] = useState<API.Project.Project>({
    id: 0,
    name: '',
    remark: '',
    orgId: 0,
    orgName: '',
  });

  const { data: organizations } = useRequest(_fetchAllOrganizations);

  useRequest(_fetchAllProjects, {
    onSuccess: (data) => {
      const orgs = data as API.Project.Project[];
      setProjects(orgs);
    },
  });

  const { run: addProject } = useRequest(_addOneProject, {
    manual: true,
    onSuccess: (data) => {
      const org = data as API.Project.Project;
      setProjects([...projects, org]);
      message.success('新建成功');
    },
  });

  const { run: deleteProject, params: _params } = useRequest(
    _deleteOneProject,
    {
      manual: true,
      onSuccess: () => {
        setProjects(projects.filter((v) => v.id !== _params[0]));
        message.success('删除成功');
      },
    },
  );

  const { run: updateProject } = useRequest(_updateOneProject, {
    manual: true,
    onSuccess: (data) => {
      const org = data as API.Project.Project;
      const others = projects.filter((v) => v.id !== org.id);
      setProjects([...others, org]);
    },
  });

  // 表格列定义
  const columns: ColumnsType<API.Project.Project> = [
    {
      title: '项目ID',
      dataIndex: 'id',
    },
    {
      title: '项目名称',
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
      render: (org: API.Project.Project) => (
        <div>
          <Button
            type="link"
            onClick={() => {
              setCurProject(org);
              setEditModel(true);
              setShowModal(true);
            }}
            className={styles.editButton}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该项目吗?"
            onConfirm={() => {
              deleteProject(org.id);
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

  const onFormFinished = (values: API.Project.AddProject) => {
    if (!values.name) {
      message.error('项目名称必填');
      return;
    }

    if (editModel) {
      const org = {
        ...values,
        id: curProject.id,
        orgId: curProject.orgId,
        orgName: curProject.orgName,
      };
      updateProject(org);
    } else {
      addProject(values);
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
      title={editModel ? '编辑项目' : '新增项目'}
    >
      <Form
        onFinish={onFormFinished}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        initialValues={editModel ? curProject : {}}
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
        <Form.Item name="name" label="项目名称">
          <Input placeholder="项目名称" />
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
      <Card title="项目管理">
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
        <Table columns={columns} dataSource={projects} bordered rowKey="id" />
      </Card>
      {model}
    </div>
  );
};

export default ProjectPage;
