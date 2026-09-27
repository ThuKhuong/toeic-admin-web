// d:\hoctaphk1nam4\DOANCHUYENNGANH\TOEIC\toeic_admin_vite\src\pages\Users.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Typography,
  Tag,
  Modal,
  Form,
  Select,
  message,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { usersService } from "../services";

const { Title } = Typography;
const { Option } = Select;

const Users = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const toUI = (u) => ({
    id: u.user_id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
  });

  const load = async (q) => {
    try {
      setLoading(true);
      const data = await usersService.list(q ? { q } : {});
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];
      setUsers(rows.map(toUI));
    } catch (e) {
      message.error("Không thể tải danh sách người dùng");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setSearchText(q);
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleSearch = async (value) => {
    setSearchText(value);
    await load(value);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      full_name: record.full_name,
      role: record.role,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        full_name: values.full_name,
        role: values.role,
      };
      await usersService.update(editingUser.id, payload);
      message.success("Cập nhật người dùng thành công");
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      await load(searchText);
    } catch (e) {
      message.error("Lưu người dùng thất bại");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xóa người dùng",
      content: `Bạn có chắc chắn muốn xóa người dùng "${
        record.full_name || record.email
      }" không? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);
          await usersService.delete(record.id);
          message.success("Đã xóa người dùng thành công");
          await load(searchText);
        } catch (e) {
          const errorMsg =
            e?.response?.data?.error ||
            e?.response?.data?.details ||
            e?.message ||
            "Không thể xóa người dùng";
          message.error(errorMsg);
          console.error("Delete user error:", e);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns = [
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Họ tên", dataIndex: "full_name", key: "full_name" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const color =
          role === "ADMIN" ? "red" : role === "TEACHER" ? "blue" : "green";
        return <Tag color={color}>{{ ADMIN: "Quản trị viên", STUDENT: "Học viên", TEACHER: "Giảng viên" }[role] || role}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Đang hoạt động" : "Đã khóa"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            aria-label="Chỉnh sửa" icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Chỉnh sửa"
          />
          <Button
            type="text"
            danger
            aria-label="Xóa" icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            title="Xóa người dùng"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>


      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Input.Search
              placeholder="Tìm kiếm theo email hoặc họ tên..."
              allowClear
              value={searchText}
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 360, maxWidth: "100%" }}
              enterButton={<SearchOutlined />}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ showSizeChanger: true, showQuickJumper: true }}
        />
      </Card>

      <Modal
        title="Chỉnh sửa người dùng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="full_name" label="Họ tên">
                <Input placeholder="Nhập họ tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: "Chọn vai trò" }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="ADMIN">Quản trị viên</Option>
                  <Option value="STUDENT">Học viên</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;





