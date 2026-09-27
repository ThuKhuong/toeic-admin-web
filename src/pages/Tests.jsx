import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Typography,
  Tag,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
  Alert,
  Spin,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { testsService } from "../services";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api$/, "");

const resolveImg = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}/${url.replace(/^\//, "")}`;
};

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [form] = Form.useForm();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [unassignedQuestions, setUnassignedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [availableCount, setAvailableCount] = useState(null);
  const [questionsPagination, setQuestionsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isAutoAssign, setIsAutoAssign] = useState(true);
  const [modalOpenTime, setModalOpenTime] = useState(0);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [testDetails, setTestDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await testsService.getAll();
        const toUI = (row) => ({
          id: row.test_id,
          title: row.test_name,
          description: row.description,
          type:
            row.test_type === "full_test"
              ? "Full Test"
              : Array.isArray(row.parts) &&
                row.parts.every((p) => [1, 2, 3, 4].includes(p))
              ? "Listening"
              : Array.isArray(row.parts) &&
                row.parts.every((p) => [5, 6, 7].includes(p))
              ? "Reading"
              : "Part Test",
          questionCount: row.total_questions ?? 0,
          timeLimit: row.time_limit ?? 60,
          status: row.publication_status === "unpublished" ? "Unpublished" : row.is_active === false ? "Draft" : "Published",
          createdAt: row.created_at ? String(row.created_at).split("T")[0] : "",
          attemptsCount: parseInt(row.attempts_count || 0),
        });
        setTests(Array.isArray(data) ? data.map(toUI) : []);
      } catch (e) {
        message.error("Không thể tải đề luyện thi");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Tự động load câu hỏi khi modal mở và autoAssign = false
  useEffect(() => {
    if (isModalVisible) {
      const autoAssign = form.getFieldValue("autoAssign");
      const partNumber = form.getFieldValue("partNumber");
      if (!autoAssign && partNumber) {
        setTimeout(() => {
          loadUnassignedQuestions(1);
        }, 200);
      }
    } else {
      setSelectedQuestionIds([]);
      setUnassignedQuestions([]);
    }
  }, [isModalVisible, isAutoAssign, modalOpenTime]);

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#999" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
      filteredValue: [searchText],
      onFilter: (value, record) =>
        record.title.toLowerCase().includes(value.toLowerCase()) ||
        (record.description &&
          record.description.toLowerCase().includes(value.toLowerCase())),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const colors = {
          Listening: "blue",
          Reading: "green",
          "Full Test": "purple",
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: "Số câu hỏi",
      dataIndex: "questionCount",
      key: "questionCount",
      align: "center",
    },
    {
      title: "Thời gian (phút)",
      dataIndex: "timeLimit",
      key: "timeLimit",
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Published" ? "success" : status === "Unpublished" ? "warning" : "default"}>
          {status === "Published" ? "Đã xuất bản" : status === "Unpublished" ? "Ngừng xuất bản" : "Bản nháp"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => {
        // Ràng buộc: Không cho sửa/xóa nếu đã có người làm bài
        const hasAttempts = (record.attemptsCount || 0) > 0;
        const disabledTooltip = hasAttempts
          ? `Không thể sửa/xóa: Đã có ${record.attemptsCount} lượt làm bài`
          : "";

        return (
          <Space size="middle">
            <Button
              type="text"
              aria-label="Xem chi tiết" icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              title="Xem chi tiết"
            />
            <Button
              type="text"
              aria-label="Chỉnh sửa" icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={hasAttempts}
              title={hasAttempts ? disabledTooltip : "Chỉnh sửa"}
            />
            <Popconfirm
              title={record.status === 'Published' ? 'Ngừng xuất bản đề này?' : 'Xuất bản đề này?'}
              description="Lịch sử và các lượt đang làm vẫn được giữ lại."
              okText="Xác nhận" cancelText="Hủy"
              onConfirm={async () => {
                const publication_status = record.status === 'Published' ? 'unpublished' : 'published';
                try {
                  await testsService.update(record.id, { publication_status });
                  setTests(items => items.map(t => t.id === record.id ? { ...t, status: publication_status === 'published' ? 'Published' : 'Unpublished' } : t));
                  message.success('Đã cập nhật trạng thái đề');
                } catch (e) { message.error(e.response?.data?.error || 'Không cập nhật được trạng thái'); }
              }}>
              <Button size="small">{record.status === 'Published' ? 'Ngừng xuất bản' : 'Xuất bản'}</Button>
            </Popconfirm>
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa đề luyện thi này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
              disabled={hasAttempts}
            >
              <Button
                type="text"
                aria-label="Xóa" icon={<DeleteOutlined />}
                danger
                disabled={hasAttempts}
                title={hasAttempts ? disabledTooltip : "Xóa"}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const handleAdd = () => {
    setEditingTest(null);
    form.resetFields();
    setSelectedQuestionIds([]);
    setUnassignedQuestions([]);
    setIsAutoAssign(true);
    form.setFieldsValue({
      type: "Reading",
      questionCount: 10,
      timeLimit: 60,
      publicationStatus: "draft",
      autoAssign: true,
      partNumber: 5,
    });
    // Force refresh bằng cách update timestamp mỗi khi mở modal
    setModalOpenTime(Date.now());
    setIsModalVisible(true);
    setTimeout(() => refreshAvailability(), 0);
  };

  const refreshAvailability = async () => {
    try {
      const values = form.getFieldsValue(["partNumber"]);
      const pn = Number(values.partNumber);
      if (!pn) {
        setAvailableCount(null);
        return;
      }
      const res = await testsService.getAvailability({ part_number: pn });
      setAvailableCount(Number(res?.available ?? 0));
    } catch {
      setAvailableCount(null);
    }
  };

  const loadUnassignedQuestions = async (page = 1) => {
    try {
      const values = form.getFieldsValue(["partNumber"]);
      const pn = Number(values.partNumber);

      if (!pn) {
        setUnassignedQuestions([]);
        setQuestionsPagination({
          ...questionsPagination,
          total: 0,
        });
        return;
      }

      setLoadingQuestions(true);

      const result = await testsService.getUnassignedQuestions({
        part_number: pn,
        page,
        limit: questionsPagination.pageSize,
      });

      setUnassignedQuestions(result.questions || []);
      setQuestionsPagination({
        ...questionsPagination,
        current: result.page || 1,
        total: result.total || 0,
      });
    } catch (error) {
      console.error("Error loading unassigned questions:", error);
      message.error("Không thể tải danh sách câu hỏi");
      setUnassignedQuestions([]);
      setQuestionsPagination({
        ...questionsPagination,
        total: 0,
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEdit = (record) => {
    // Force refresh bằng cách update timestamp mỗi khi mở modal
    setModalOpenTime(Date.now());
    // Ràng buộc: Không cho sửa nếu đã có người làm bài
    // Kiểm tra xem có người đã làm bài chưa
    if ((record.attemptsCount || 0) > 0) {
      Modal.error({
        title: "Không thể sửa đề luyện thi",
        content: `Đề luyện thi này đã có ${record.attemptsCount} lượt làm bài. Bạn có thể ngừng xuất bản đề hoặc tạo đề mới.`,
        okText: "Đã hiểu",
      });
      return;
    }

    setEditingTest(record);
    setSelectedQuestionIds([]);
    setUnassignedQuestions([]);
    setIsAutoAssign(true); // Mặc định là true khi edit
    form.setFieldsValue({
      ...record,
      publicationStatus: record.status === "Published" ? "published" : record.status === "Unpublished" ? "unpublished" : "draft",
      autoAssign: true, // Mặc định khi edit
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await testsService.delete(id);
      const data = await testsService.getAll();
      const toUI = (row) => ({
        id: row.test_id,
        title: row.test_name,
        description: row.description,
        type:
          row.test_type === "full_test"
            ? "Full Test"
            : Array.isArray(row.parts) &&
              row.parts.every((p) => [1, 2, 3, 4].includes(p))
            ? "Listening"
            : Array.isArray(row.parts) &&
              row.parts.every((p) => [5, 6, 7].includes(p))
            ? "Reading"
            : "Part Test",
        questionCount: row.total_questions ?? 0,
        timeLimit: row.time_limit ?? 60,
        status: row.publication_status === "unpublished" ? "Unpublished" : row.is_active === false ? "Draft" : "Published",
        createdAt: row.created_at ? String(row.created_at).split("T")[0] : "",
        attemptsCount: parseInt(row.attempts_count || 0),
      });
      setTests(Array.isArray(data) ? data.map(toUI) : []);
      message.success("Xóa đề luyện thi thành công!");
    } catch (e) {
      const errorMsg =
        e?.response?.data?.error || e?.message || "Xóa đề luyện thi thất bại";
      const errorCode = e?.response?.data?.code;

      // Ràng buộc: Hiển thị lỗi nếu có người đã làm bài
      // Hiển thị lỗi chi tiết nếu có người đã làm bài
      if (
        errorCode === "HAS_ATTEMPTS" ||
        (errorMsg.includes("đã có") && errorMsg.includes("lượt làm bài"))
      ) {
        Modal.error({
          title: "Không thể xóa đề luyện thi",
          content: errorMsg,
          okText: "Đã hiểu",
        });
      } else {
        message.error(errorMsg);
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record) => {
    try {
      setDetailLoading(true);
      setDetailModalVisible(true);
      const response = await testsService.getById(record.id, true);
      setTestDetails(response);
    } catch (error) {
      message.error("Không thể tải chi tiết đề luyện thi");
      console.error(error);
      setDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const typeMap = (t) => (t === "Full Test" ? "full_test" : "part_test");
      const payload = {
        test_name: values.title,
        test_type: typeMap(values.type),
        description: values.description,
        time_limit: Number(values.timeLimit),
        parts:
          values.type === "Full Test"
            ? [1, 2, 3, 4, 5, 6, 7]
            : values.partNumber
            ? [Number(values.partNumber)]
            : values.type === "Listening"
            ? [1, 2, 3, 4]
            : [5, 6, 7],
        publication_status: values.publicationStatus,
      };

      if (editingTest) {
        await testsService.update(editingTest.id, payload);
        if (values.autoAssign && values.partNumber && values.questionCount) {
          const result = await testsService.autoGenerate({
            test_id: editingTest.id,
            part_number: Number(values.partNumber),
            total_questions: Number(values.questionCount),
          });
          if (result.assigned > 0) {
            message.success(`Đã gán ngẫu nhiên ${result.assigned} câu hỏi`);
          } else {
            // Hiển thị cảnh báo nếu không gán được câu hỏi nào
            const warningMsg =
              result.warning || "Không tìm thấy câu hỏi phù hợp để gán";
            message.warning(warningMsg);
          }
        } else if (!values.autoAssign && selectedQuestionIds.length > 0) {
          // Gán câu hỏi thủ công khi edit
          const result = await testsService.assignQuestions({
            test_id: editingTest.id,
            question_ids: selectedQuestionIds,
          });
          message.success(`Đã gán ${result.assigned} câu hỏi vào đề luyện thi`);
        } else {
          message.success("Cập nhật đề luyện thi thành công");
        }
      } else {
        let newTestId = null;

        if (values.autoAssign && values.partNumber && values.questionCount) {
          // Tự động gán
          const requested = Number(values.questionCount);
          const result = await testsService.createWithQuestions({
            ...payload,
            part_number: Number(values.partNumber),
            total_questions: requested,
          });
          const assigned = Number(
            result?.assigned ??
              (Array.isArray(result?.questions) ? result.questions.length : 0)
          );
          if (assigned === 0) {
            // Hiển thị cảnh báo nếu không gán được câu hỏi nào
            const warningMsg =
              result?.warning ||
              `Không tìm thấy câu hỏi phù hợp để gán cho Part ${values.partNumber}`;
            message.warning(warningMsg);
          } else if (assigned < requested) {
            message.warning(
              `Chỉ gán được ${assigned}/${requested} câu hỏi (không đủ câu chưa gán ở Part ${values.partNumber})`
            );
          } else {
            message.success(
              `Tạo đề luyện thi và gán ${assigned} câu hỏi thành công`
            );
          }
          newTestId = result?.test?.test_id;
        } else {
          // Tạo test rỗng
          const result = await testsService.create(payload);
          newTestId = result?.test_id || result?.id;
          message.success("Tạo đề luyện thi thành công");

          // Nếu có câu hỏi được chọn, gán vào test
          if (
            !values.autoAssign &&
            selectedQuestionIds.length > 0 &&
            newTestId
          ) {
            const assignResult = await testsService.assignQuestions({
              test_id: newTestId,
              question_ids: selectedQuestionIds,
            });
            message.success(
              `Đã gán ${assignResult.assigned} câu hỏi vào đề luyện thi`
            );
          }
        }
      }

      const data = await testsService.getAll();
      const toUI = (row) => ({
        id: row.test_id,
        title: row.test_name,
        description: row.description,
        type:
          row.test_type === "full_test"
            ? "Full Test"
            : Array.isArray(row.parts) &&
              row.parts.every((p) => [1, 2, 3, 4].includes(p))
            ? "Listening"
            : Array.isArray(row.parts) &&
              row.parts.every((p) => [5, 6, 7].includes(p))
            ? "Reading"
            : "Part Test",
        questionCount: row.total_questions ?? 0,
        timeLimit: row.time_limit ?? 60,
        status: row.publication_status === "unpublished" ? "Unpublished" : row.is_active === false ? "Draft" : "Published",
        createdAt: row.created_at ? String(row.created_at).split("T")[0] : "",
        attemptsCount: parseInt(row.attempts_count || 0),
      });
      setTests(Array.isArray(data) ? data.map(toUI) : []);

      setIsModalVisible(false);
      form.resetFields();
      setSelectedQuestionIds([]);
      setUnassignedQuestions([]);
    } catch (e) {
      const errorMsg =
        e?.response?.data?.error || e?.message || "Lưu đề luyện thi thất bại";
      const errorCode = e?.response?.data?.code;

      // Ràng buộc: Hiển thị lỗi nếu có người đã làm bài
      // Hiển thị lỗi chi tiết nếu có người đã làm bài
      if (
        errorCode === "HAS_ATTEMPTS" ||
        (errorMsg.includes("đã có") && errorMsg.includes("lượt làm bài"))
      ) {
        Modal.error({
          title: "Không thể sửa đề luyện thi",
          content: errorMsg,
          okText: "Đã hiểu",
        });
      } else {
        message.error(errorMsg);
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tests-page">


      <Card className="tests-card">
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Tạo đề luyện thi
            </Button>
          </Col>
          <Col>
            <Space.Compact style={{ width: 300 }}>
              <Input
                placeholder="Tìm kiếm đề luyện thi"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => {}}
              />
              <Button aria-label="Tìm kiếm" icon={<SearchOutlined />} onClick={() => {}} />
            </Space.Compact>
          </Col>
        </Row>

        <Table
          className="tests-table"
          columns={columns}
          dataSource={tests}
          rowKey="id"
          loading={loading}
          rowClassName={() => "tests-row"}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} đề luyện thi`,
          }}
        />
      </Card>

      <Modal
        title={editingTest ? "Chỉnh sửa đề luyện thi" : "Tạo đề luyện thi mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedQuestionIds([]);
          setUnassignedQuestions([]);
        }}
        footer={null}
        width={!isAutoAssign ? 1000 : 700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changed) => {
            if (changed.partNumber !== undefined) {
              const pn = Number(changed.partNumber);
              const t = [1, 2, 3, 4].includes(pn) ? "Listening" : "Reading";
              form.setFieldsValue({ type: t });
              refreshAvailability();
              // Reload questions nếu autoAssign = false
              const autoAssign = form.getFieldValue("autoAssign");
              if (!autoAssign && pn) {
                setSelectedQuestionIds([]);
                // Reset pagination về trang 1
                setQuestionsPagination({
                  ...questionsPagination,
                  current: 1,
                });
                // Load câu hỏi của part mới
                setTimeout(() => {
                  loadUnassignedQuestions(1);
                }, 50);
              }
            }
            if (changed.type !== undefined) {
              const t = changed.type;
              if (t === "Full Test") {
                form.setFieldsValue({ partNumber: undefined });
              } else if (t === "Listening") {
                const pn = Number(form.getFieldValue("partNumber"));
                if (!pn || pn < 1 || pn > 4)
                  form.setFieldsValue({ partNumber: 1 });
              } else if (t === "Reading") {
                const pn = Number(form.getFieldValue("partNumber"));
                if (!pn || pn < 5 || pn > 7)
                  form.setFieldsValue({ partNumber: 5 });
              }
              refreshAvailability();
            }
            
            if (changed.autoAssign !== undefined) {
              setIsAutoAssign(changed.autoAssign);
              if (!changed.autoAssign) {
                // Tắt autoAssign: load danh sách câu hỏi nếu đã có partNumber
                const partNumber = form.getFieldValue("partNumber");
                if (partNumber) {
                  setSelectedQuestionIds([]);
                  setQuestionsPagination({
                    ...questionsPagination,
                    current: 1,
                  });
                  setTimeout(() => {
                    loadUnassignedQuestions(1);
                  }, 50);
                }
              } else {
                // Bật autoAssign: clear selection
                setSelectedQuestionIds([]);
                setUnassignedQuestions([]);
              }
            }
          }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Nhập tiêu đề đề luyện thi" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Nhập mô tả đề luyện thi (tùy chọn)" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="Loại test"
                rules={[
                  { required: true, message: "Vui lòng chọn loại test!" },
                ]}
              >
                <Select placeholder="Chọn loại test">
                  <Option value="Listening">Listening</Option>
                  <Option value="Reading">Reading</Option>
                  <Option value="Full Test">Full Test</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="questionCount"
                label="Số câu hỏi"
                dependencies={["partNumber"]}
                rules={[
                  { required: true, message: "Vui lòng nhập số câu hỏi!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const partNumber = getFieldValue("partNumber");
                      if (partNumber === 7 && value && value < 8) {
                        return Promise.reject(
                          new Error("Part 7 cần tối thiểu 8 câu hỏi!")
                        );
                      }
                      if (availableCount !== null && value > availableCount) {
                        return Promise.reject(
                          new Error("Bạn đã nhập quá số câu hỏi còn trống")
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={form.getFieldValue("partNumber") === 7 ? 8 : 1}
                  max={200}
                  placeholder="Số câu hỏi"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                shouldUpdate={(prevValues, curValues) =>
                  prevValues.partNumber !== curValues.partNumber
                }
                noStyle
              >
                {({ getFieldValue }) => (
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {availableCount !== null
                      ? `Còn trống: ${availableCount} câu`
                      : getFieldValue("partNumber") === 7
                      ? "Part 7 cần tối thiểu 8 câu hỏi"
                      : ""}
                  </div>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="timeLimit"
                label="Thời gian (phút)"
                rules={[
                  { required: true, message: "Vui lòng nhập thời gian!" },
                ]}
              >
                <InputNumber
                  min={1}
                  max={180}
                  placeholder="Thời gian làm bài"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="publicationStatus" label="Trạng thái" rules={[{required:true}]}>
                <Select options={[{value:'draft',label:'Bản nháp'},{value:'published',label:'Đã xuất bản'},{value:'unpublished',label:'Ngừng xuất bản'}]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="autoAssign"
                label="Tự động gán câu hỏi"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="partNumber" label="Phần">
                <Select
                  placeholder="Chọn phần"
                  disabled={form.getFieldValue("type") === "Full Test"}
                  onChange={(value) => {
                    // Reset questionCount khi đổi part để tránh giá trị không hợp lệ
                    const questionCount = form.getFieldValue("questionCount");
                    if (value === 7 && questionCount && questionCount < 8) {
                      form.setFieldsValue({ questionCount: 8 });
                    } else if (
                      value !== 7 &&
                      questionCount &&
                      questionCount < 1
                    ) {
                      form.setFieldsValue({ questionCount: 1 });
                    }
                  }}
                >
                  <Option value={1}>Part 1</Option>
                  <Option value={2}>Part 2</Option>
                  <Option value={3}>Part 3</Option>
                  <Option value={4}>Part 4</Option>
                  <Option value={5}>Part 5</Option>
                  <Option value={6}>Part 6</Option>
                  <Option value={7}>Part 7</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Hiển thị bảng chọn câu hỏi khi tắt autoAssign */}
          {!isAutoAssign && form.getFieldValue("partNumber") && (
            <Form.Item label="Chọn câu hỏi">
              <Alert
                message={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      Chọn các câu hỏi từ danh sách bên dưới để gán vào đề luyện thi
                    </span>
                    <Button
                      type="link"
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setSelectedQuestionIds([]);
                        loadUnassignedQuestions(1);
                      }}
                      style={{ padding: 0, height: "auto" }}
                    >
                      Làm mới
                    </Button>
                  </div>
                }
                type="info"
                style={{ marginBottom: 16 }}
              />
              <Spin spinning={loadingQuestions}>
                <Table
                  rowKey="question_id"
                  dataSource={unassignedQuestions}
                  pagination={{
                    current: questionsPagination.current,
                    pageSize: questionsPagination.pageSize,
                    total: questionsPagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Tổng ${total} câu hỏi`,
                    onChange: (page, pageSize) => {
                      setQuestionsPagination({
                        ...questionsPagination,
                        current: page,
                        pageSize,
                      });
                      loadUnassignedQuestions(page);
                    },
                  }}
                  rowSelection={{
                    selectedRowKeys: selectedQuestionIds,
                    onChange: (selectedRowKeys) => {
                      setSelectedQuestionIds(selectedRowKeys);
                    },
                    getCheckboxProps: (record) => ({
                      disabled: false,
                    }),
                  }}
                  columns={[
                    {
                      title: "Nội dung câu hỏi",
                      dataIndex: "question_text",
                      key: "question_text",
                      ellipsis: true,
                      render: (text) => text || "(Không có nội dung)",
                    },
                    {
                      title: "Đáp án đúng",
                      dataIndex: "correct_answer",
                      key: "correct_answer",
                      width: 120,
                    },
                  ]}
                  size="small"
                  style={{ maxHeight: 400, overflowY: "auto" }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                  Đã chọn: <strong>{selectedQuestionIds.length}</strong> câu hỏi
                </div>
              </Spin>
            </Form.Item>
          )}

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingTest ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết đề luyện thi"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            Đang tải chi tiết...
          </div>
        ) : testDetails ? (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h3>{testDetails.test_name}</h3>
              {testDetails.description && (
                <p style={{ color: "#666", marginBottom: 16 }}>
                  {testDetails.description}
                </p>
              )}
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Loại:</strong>{" "}
                    {testDetails.test_type === "full_test"
                      ? "Full Test"
                      : Array.isArray(testDetails.parts) &&
                        testDetails.parts.every((p) => [1, 2, 3, 4].includes(p))
                      ? "Listening"
                      : Array.isArray(testDetails.parts) &&
                        testDetails.parts.every((p) => [5, 6, 7].includes(p))
                      ? "Reading"
                      : "Part Test"}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Tổng câu hỏi:</strong>{" "}
                    {testDetails.total_questions || 0}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Thời gian:</strong> {testDetails.time_limit || 60}{" "}
                    phút
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Trạng thái:</strong>
                    <Tag color={testDetails.is_active ? "success" : "default"}>
                      {testDetails.publication_status === "unpublished" ? "Ngừng xuất bản" : testDetails.is_active ? "Đã xuất bản" : "Bản nháp"}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Ngày tạo:</strong>{" "}
                    {testDetails.created_at
                      ? String(testDetails.created_at).split("T")[0]
                      : ""}
                  </div>
                </Col>
              </Row>
            </div>

            <div>
              <h4>Danh sách câu hỏi</h4>
              {Array.isArray(testDetails.questions) &&
              testDetails.questions.length > 0 ? (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {(() => {
                    // Group questions by passage for Part 6/7
                    const passages = {};
                    const standaloneQuestions = [];

                    testDetails.questions.forEach((q) => {
                      if (q.passage_id) {
                        if (!passages[q.passage_id]) {
                          passages[q.passage_id] = {
                            key: q.passage_id,
                            title:
                              q.passage_title || `Đoạn văn ${q.passage_id}`,
                            content: q.passage_content || "",
                            questions: [],
                          };
                        }
                        passages[q.passage_id].questions.push(q);
                      } else {
                        standaloneQuestions.push(q);
                      }
                    });

                    return (
                      <div>
                        {/* Render passages with their questions */}
                        {Object.values(passages).map((passage) => (
                          <div
                            key={passage.key}
                            style={{
                              marginBottom: 24,
                              padding: 16,
                              backgroundColor: "#f5f5f5",
                              borderRadius: 8,
                            }}
                          >
                            <h5 style={{ marginBottom: 8 }}>{passage.title}</h5>
                            {resolveImg(
                              passage.image_url || passage.passage_image_url
                            ) && (
                              <div style={{ marginBottom: 12 }}>
                                <img
                                  src={resolveImg(
                                    passage.image_url ||
                                      passage.passage_image_url
                                  )}
                                  alt="Passage"
                                  style={{
                                    maxWidth: "100%",
                                    borderRadius: 6,
                                    border: "1px solid #eee",
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                            {passage.content && (
                              <div
                                style={{
                                  marginBottom: 16,
                                  padding: 12,
                                  backgroundColor: "white",
                                  borderRadius: 4,
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                }}
                              >
                                {passage.content}
                              </div>
                            )}
                            {passage.questions.map((q) => (
                              <div
                                key={q.question_id}
                                style={{
                                  marginBottom: 12,
                                  padding: 12,
                                  backgroundColor: "white",
                                  borderRadius: 4,
                                }}
                              >
                                <div style={{ marginBottom: 8 }}>
                                  <strong>Câu {q.question_number}: </strong>
                                  {q.question_text}
                                </div>
                                <div style={{ marginLeft: 16, fontSize: 13 }}>
                                  {q.choices &&
                                    q.choices.map((choice) => (
                                      <div key={choice.choice_id}>
                                        {choice.choice_label}:{" "}
                                        {choice.choice_text}
                                      </div>
                                    ))}
                                  <div
                                    style={{
                                      marginTop: 8,
                                      color: "#1890ff",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Đáp án đúng:{" "}
                                    {q.correct_answer || "Không xác định"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* Render standalone questions (Part 5) */}
                        {standaloneQuestions.map((q) => (
                          <div
                            key={q.question_id}
                            style={{
                              marginBottom: 12,
                              padding: 12,
                              backgroundColor: "#f5f5f5",
                              borderRadius: 8,
                            }}
                          >
                            <div style={{ marginBottom: 8 }}>
                              <strong>Câu {q.question_number}: </strong>
                              {q.question_text}
                            </div>
                            <div style={{ marginLeft: 16, fontSize: 13 }}>
                              {q.choices &&
                                q.choices.map((choice) => (
                                  <div key={choice.choice_id}>
                                    {choice.choice_label}: {choice.choice_text}
                                  </div>
                                ))}
                              <div
                                style={{
                                  marginTop: 8,
                                  color: "#1890ff",
                                  fontWeight: "bold",
                                }}
                              >
                                Đáp án đúng:{" "}
                                {q.correct_answer || "Không xác định"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#999",
                  }}
                >
                  Chưa có câu hỏi nào được gán cho đề luyện thi này
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Tests;




