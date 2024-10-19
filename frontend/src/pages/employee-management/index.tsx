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
  fetchEmployeesRequest,
  addOneEmployeeRequest,
  deleteOneEmployeeRequest,
  updateOneEmployeeRequest,
} from "@/service";
import styles from "./index.css";

const EmployeeManagementPage: React.FC = () => {
  // 弹窗展示
  const [modalOpen, setModalOpen] = useState(false);
  const [curEmployee, setCurEmployee] = useState<API.Employee | null>(null);

  // 各种网络请求
  const { runAsync: fetchEmployees, data: employees } = useRequest(
    fetchEmployeesRequest
  );
  const { runAsync: addOneEmployee } = useRequest(addOneEmployeeRequest, {
    manual: true,
  });
  const { runAsync: updateOneEmployee } = useRequest(updateOneEmployeeRequest, {
    manual: true,
  });
  const { runAsync: deleteOneEmployee } = useRequest(deleteOneEmployeeRequest, {
    manual: true,
  });

  // 删除一个人员
  const onDelete = async (id: string) => {
    const _ = await deleteOneEmployee(id);
    await fetchEmployees();
  };

  // 主体表格配置
  const columns: TableProps<API.Employee>["columns"] = [
    {
      title: "人员ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "人员名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "操作",
      key: "operation",
      render: (_, employee) => {
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
                  setCurEmployee(employee);
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
                title="删除人员"
                description="此操作无法恢复。是否确认删除？"
                okText="确认"
                cancelText="取消"
                icon={
                  <ExclamationCircleOutlined style={{ color: "#2D3047BB" }} />
                }
                onConfirm={() => {
                  if (employee.id) {
                    onDelete(employee.id);
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
      const newEmployee: API.Employee = {
        name: value.name,
      };
      setModalOpen(false);
      if (!curEmployee?.id) {
        // 无id，则认为需要新增
        await addOneEmployee(newEmployee);
      } else if (curEmployee.name !== newEmployee.name) {
        // 避免无效修改
        newEmployee.id = curEmployee.id;
        await updateOneEmployee(newEmployee);
      }
      setCurEmployee(null);
      fetchEmployees();
    };

    return (
      <Modal
        className={styles.addEditModal}
        open={modalOpen}
        title={`${!!curEmployee ? "编辑人员" : "新增人员"}`}
        footer={null}
        destroyOnClose
        onCancel={() => {
          setModalOpen(false);
          setCurEmployee(null);
        }}
      >
        <div className={styles.addEditForm}>
          <Divider />
          <Form onFinish={onFormFinished}>
            <Form.Item
              name="name"
              label="人员名称"
              rules={[{ required: true }]}
              initialValue={curEmployee?.name}
            >
              <Input placeholder="人员名称" />
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
    <Card className={styles.mainCard} title="人员管理">
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
            fetchEmployees();
          }}
        >
          刷新
        </Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={employees} />
      <AddEditModal />
    </Card>
  );
};

export default EmployeeManagementPage;
