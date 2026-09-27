import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  message,
  Spin,
} from "antd";
import {
  FileTextOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { testAttemptsService, testsService } from "../services";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const TestAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    test_id: undefined,
  });

  // Data for filters
  const [tests, setTests] = useState([]);

  // Statistics
  const [stats, setStats] = useState({
    totalAttempts: 0,
  });

  // Detail Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    loadAttempts();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadTests = async () => {
    try {
      const data = await testsService.getAll();
      setTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load tests:", error);
    }
  };

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };

      const response = await testAttemptsService.getAll(params);

      setAttempts(response.attempts || []);
      setPagination({
        ...pagination,
        total: response.total || 0,
      });

      setStats({ totalAttempts: response.total || 0 });
    } catch (error) {
      console.error("Failed to load attempts:", error);
      message.error("Không thể tải danh sách bài thi");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (attemptId) => {
    try {
      setDetailLoading(true);
      setDetailModalVisible(true);
      setAttemptDetail(null); // Reset trước khi load
      const detail = await testAttemptsService.getDetail(attemptId);
      console.log("Attempt detail response:", detail); // Debug log

      // Kiểm tra format response
      if (!detail) {
        message.error("Không tìm thấy chi tiết bài thi");
        setDetailModalVisible(false);
        return;
      }

      // Đảm bảo format đúng: { attempt: {...}, answers: [...] }
      if (!detail.attempt || !detail.answers) {
        console.error("Invalid detail format:", detail);
        message.error("Định dạng dữ liệu không hợp lệ");
        setDetailModalVisible(false);
        return;
      }

      setAttemptDetail(detail);
    } catch (error) {
      console.error("Failed to load attempt detail:", error);
      const errorMsg =
        error?.response?.data?.error ||
        error?.message ||
        "Không thể tải chi tiết bài thi";
      message.error(errorMsg);
      setDetailModalVisible(false);
      setAttemptDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleFilterChange = (value) => {
    setFilters({
      test_id: value,
    });
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const columns = [
    {
      title: "Học sinh",
      dataIndex: "full_name",
      key: "full_name",
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: "Bài test",
      dataIndex: "test_name",
      key: "test_name",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Kết quả",
      key: "result",
      align: "center",
      render: (_, record) => (
        <Text strong style={{ fontSize: 16 }}>
          {record.total_correct}/{record.total_questions}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail(record.attempt_id)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>


      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Statistic
              title="Tổng số lượt thi"
              value={stats.totalAttempts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={18}>
            <Select
              value={filters.test_id}
              placeholder="Lọc theo đề luyện thi"
              style={{ width: "100%" }}
              allowClear
              onChange={handleFilterChange}
              showSearch
              optionFilterProp="children"
            >
              {tests.map((test) => (
                <Option key={test.test_id} value={test.test_id}>
                  {test.test_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Button
              type="default"
              block
              onClick={() => {
                setFilters({ test_id: undefined });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={attempts}
          rowKey="attempt_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết kết quả làm bài"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : attemptDetail ? (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Thời gian bắt đầu">
                {dayjs(attemptDetail.attempt?.start_time).format(
                  "DD/MM/YYYY HH:mm:ss"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian hoàn thành">
                {attemptDetail.attempt?.end_time
                  ? dayjs(attemptDetail.attempt?.end_time).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )
                  : "Chưa hoàn thành"}
              </Descriptions.Item>
              <Descriptions.Item label="Số câu đúng">
                <Text strong>
                  {attemptDetail.attempt?.total_correct} /{" "}
                  {attemptDetail.attempt?.total_questions}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian làm bài">
                {Math.floor(attemptDetail.attempt?.time_spent / 60)} phút{" "}
                {attemptDetail.attempt?.time_spent % 60} giây
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Chi tiết từng câu hỏi</Title>
            <Table
              dataSource={attemptDetail.answers || []}
              rowKey="question_id"
              pagination={false}
              scroll={{ y: 400 }}
              size="small"
              columns={[
                {
                  title: "Câu",
                  key: "question_number",
                  width: 60,
                  align: "center",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Câu hỏi",
                  dataIndex: "question_text",
                  key: "question_text",
                  ellipsis: true,
                },
                {
                  title: "Đáp án của học sinh",
                  dataIndex: "user_answer",
                  key: "user_answer",
                  width: 80,
                  align: "center",
                  render: (answer) => <Tag>{answer || "-"}</Tag>,
                },
                {
                  title: "Đáp án đúng",
                  dataIndex: "correct_answer",
                  key: "correct_answer",
                  width: 80,
                  align: "center",
                  render: (answer) => <Tag color="success">{answer}</Tag>,
                },
                {
                  title: "Kết quả",
                  dataIndex: "is_correct",
                  key: "is_correct",
                  width: 100,
                  align: "center",
                  render: (correct) =>
                    correct ? (
                      <Tag color="success">
                        <CheckCircleOutlined /> Đúng
                      </Tag>
                    ) : (
                      <Tag color="error">
                        <CloseCircleOutlined /> Sai
                      </Tag>
                    ),
                },
              ]}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default TestAttempts;



