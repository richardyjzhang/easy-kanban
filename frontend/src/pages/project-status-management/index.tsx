import React, { useState } from "react";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Popconfirm,
  Table,
  TableProps,
  ConfigProvider,
  Modal,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import {
  fetchProjectStatusRequest,
  addOneProjectStatusRequest,
  deleteOneProjectStatusRequest,
  updateOneProjectStatusRequest,
} from "@/service";
import styles from "./index.css";

const ProjectStatusManagementPage: React.FC = () => {
  // 弹窗展示
  const [modalOpen, setModalOpen] = useState(false);
  const [curProjectStatus, setCurProjectStatus] =
    useState<API.ProjectStatus | null>(null);

  // 各种网络请求
  const { runAsync: fetchProjectStatus, data: statuss } = useRequest(
    fetchProjectStatusRequest
  );
  const { runAsync: addOneProjectStatus } = useRequest(
    addOneProjectStatusRequest,
    {
      manual: true,
    }
  );
  const { runAsync: updateOneProjectStatus } = useRequest(
    updateOneProjectStatusRequest,
    {
      manual: true,
    }
  );
  const { runAsync: deleteOneProjectStatus } = useRequest(
    deleteOneProjectStatusRequest,
    {
      manual: true,
    }
  );

  // 删除一个项目阶段
  const onDelete = async (id: string) => {
    const _ = await deleteOneProjectStatus(id);
    await fetchProjectStatus();
  };

  // 主体表格配置
  const columns: TableProps<API.ProjectStatus>["columns"] = [
    {
      title: "项目阶段ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "项目阶段名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "操作",
      key: "operation",
      render: (_, status) => {
        return (
          <div className={styles.operations}>
            <ConfigProvider
              theme={{
                token: {
                  colorLink: "#2D3047",
                },
              }}
            >
              <Button
                className={styles.operationButton}
                icon={<EditOutlined />}
                type="link"
                onClick={() => {
                  setCurProjectStatus(status);
                  setModalOpen(true);
                }}
              >
                编辑
              </Button>
            </ConfigProvider>
            <ConfigProvider
              theme={{
                token: {
                  colorLink: "#B22222",
                },
              }}
            >
              <Popconfirm
                title="删除项目阶段"
                description="此操作无法恢复。是否确认删除？"
                okText="确认"
                cancelText="取消"
                icon={
                  <ExclamationCircleOutlined style={{ color: "#2D3047BB" }} />
                }
                onConfirm={() => {
                  if (status.id) {
                    onDelete(status.id);
                  }
                }}
              >
                <Button
                  className={styles.operationButton}
                  icon={<DeleteOutlined />}
                  type="link"
                >
                  删除
                </Button>
              </Popconfirm>
            </ConfigProvider>
          </div>
        );
      },
    },
  ];

  // 新增编辑弹窗
  const AddEditModal = () => {
    const onFormFinished = async (value: { name: string; color: string }) => {
      const newProjectStatus: API.ProjectStatus = {
        name: value.name,
      };
      setModalOpen(false);
      if (!curProjectStatus?.id) {
        // 无id，则认为需要新增
        await addOneProjectStatus(newProjectStatus);
      } else if (curProjectStatus.name !== newProjectStatus.name) {
        // 避免无效修改
        newProjectStatus.id = curProjectStatus.id;
        await updateOneProjectStatus(newProjectStatus);
      }
      setCurProjectStatus(null);
      fetchProjectStatus();
    };

    return (
      <Modal
        className={styles.addEditModal}
        open={modalOpen}
        title={`${!!curProjectStatus ? "编辑项目阶段" : "新增项目阶段"}`}
        footer={null}
        destroyOnClose
        onCancel={() => {
          setModalOpen(false);
          setCurProjectStatus(null);
        }}
      >
        <div className={styles.addEditForm}>
          <Divider />
          <Form onFinish={onFormFinished}>
            <Form.Item
              name="name"
              label="项目阶段名称"
              rules={[{ required: true }]}
              initialValue={curProjectStatus?.name}
            >
              <Input placeholder="项目阶段名称" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className={styles.addEditButton}
            >
              确认
            </Button>
          </Form>
        </div>
      </Modal>
    );
  };

  return (
    <Card className={styles.mainCard} title="项目阶段管理">
      <div className={styles.search}>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => {
            setModalOpen(true);
          }}
        >
          新增
        </Button>
        <div className={styles.space} />
        <Button
          icon={<ReloadOutlined />}
          type="primary"
          onClick={() => {
            fetchProjectStatus();
          }}
        >
          刷新
        </Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={statuss} />
      <AddEditModal />
    </Card>
  );
};

export default ProjectStatusManagementPage;
