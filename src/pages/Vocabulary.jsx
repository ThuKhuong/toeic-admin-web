import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Typography,
  Modal,
  Form,
  Select,
  Upload,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from "@ant-design/icons";
import api from "../services/api";
import * as XLSX from "xlsx";

const { Title } = Typography;

const Vocabulary = () => {
  const [vocabulary, setVocabulary] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [form] = Form.useForm();

  // Topic management states
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm] = Form.useForm();

  const topicName = (id) => topics.find((t) => t.topic_id === id)?.name || "";

  const toUI = (row) => ({
    id: row.vocab_id,
    word: row.word,
    meaning: row.meaning_vi,
    meaning_en: row.meaning_en || "",
    pronunciation: row.pronunciation,
    part_of_speech: row.part_of_speech || "",
    example_sentence: row.example_sentence || "",
    example_translation: row.example_translation || "",
    audio_url: row.audio_url || "",
    image_url: row.image_url || "",
    topic_id: row.topic_id || null,
    topic: row.category || topicName(row.topic_id),
    difficulty: row.difficulty_level,
    tags: Array.isArray(row.tags) ? row.tags : [],
  });

  const toPayload = (values, existing) => ({
    word: values.word,
    pronunciation: values.pronunciation,
    meaning_vi: values.meaning,
    meaning_en: values.meaning_en || "",
    part_of_speech: values.part_of_speech || null,
    example_sentence: values.example_sentence || "",
    example_translation: values.example_translation || "",
    audio_url: values.audio_url || "",
    image_url: values.image_url || "",
    tags: Array.isArray(values.tags) ? values.tags : null,
    difficulty_level: Number(values.difficulty_level),
    topic_id: values.topic_id ?? null,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await loadTopics();

        let vocabData = [];
        try {
          const v = await api.get("/admin/vocabulary");
          vocabData = Array.isArray(v) ? v : [];
        } catch (e) {
          try {
            const v2 = await api.get("/student/vocabulary");
            vocabData = Array.isArray(v2) ? v2 : [];
          } catch (err) {
            message.error("Không thể tải từ vựng");
            console.error(err);
          }
        }
        setVocabulary(vocabData.map(toUI));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleImportVocabExcel = async (file) => {
    try {
      setLoading(true);
      if (!XLSX || !XLSX.read) {
        message.error("Thiếu thư viện xlsx. Vui lòng chạy: npm i xlsx");
        return false;
      }
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const items = rows
        .map((r) => {
          const topicNameStr = String(r.topic || r.topic_name || "").trim();
          const t = topics.find(
            (x) => (x.name || "").toLowerCase() === topicNameStr.toLowerCase()
          );
          const tagsRaw = r.tags;
          const tags = Array.isArray(tagsRaw)
            ? tagsRaw
            : String(tagsRaw || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
          return {
            _source: { file: file.name, sheet: wb.SheetNames[0], row: r.__rowNum__ + 1 },
            topic_name: topicNameStr,
            word: String(r.word || "").trim(),
            pronunciation: String(r.pronunciation || "").trim(),
            meaning_vi: String(r.meaning_vi || "").trim(),
            meaning_en: String(r.meaning_en || ""),
            part_of_speech: String(r.part_of_speech || ""),
            example_sentence: String(r.example_sentence || ""),
            example_translation: String(r.example_translation || ""),
            audio_url: String(r.audio_url || ""),
            image_url: String(r.image_url || ""),
            tags: tags.length ? tags : null,
            topic_id: r.topic_id ? Number(r.topic_id) : t?.topic_id ?? null,
          };
        })
        ;
      if (!items.length) {
        message.error("Không tìm thấy dữ liệu hợp lệ trong file");
        return false;
      }
      const result = await api.post("/admin/vocabulary/import", { items });
      const created = Number(result?.created ?? 0);
      if (result.duplicate) { message.info("File này đã được nhập, không tạo bản sao."); return false; }
      message.success(`Đã nhập ${created}/${items.length} từ vựng thành công`);
      Modal.success({
        title: "Import thành công",
        content: `Đã nhập ${created}/${items.length} từ vựng`,
      });
      const data = await api.get("/admin/vocabulary");
      setVocabulary(Array.isArray(data) ? data.map(toUI) : []);
    } catch (e) {
      if (e.response?.data?.errors?.length) {
        Modal.error({ title: 'Chưa nhập dữ liệu', width: 720, content: <div style={{maxHeight:400,overflow:'auto'}}>{e.response.data.errors.map((x,i)=><p key={i}>{x.file} · {x.sheet} · Dòng {x.row} · {x.column}: {x.error}</p>)}</div> });
      }
      const msg = String(e?.message || "").toLowerCase();
      if (msg.includes("token"))
        message.error("Bạn cần đăng nhập admin để import");
      else message.error("Nhập Excel thất bại");
      console.error(e);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const columns = [
    {
      title: "Từ vựng",
      dataIndex: "word",
      key: "word",
      render: (text) => <strong>{text}</strong>,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        (record.word || "")
          .toLowerCase()
          .includes(String(value).toLowerCase()) ||
        (record.meaning || "")
          .toLowerCase()
          .includes(String(value).toLowerCase()),
    },
    {
      title: "Nghĩa",
      dataIndex: "meaning",
      key: "meaning",
    },
    {
      title: "Nghĩa (EN)",
      dataIndex: "meaning_en",
      key: "meaning_en",
    },
    {
      title: "Phiên âm",
      dataIndex: "pronunciation",
      key: "pronunciation",
      render: (text) => <code>{text}</code>,
    },
    {
      title: "Từ loại",
      dataIndex: "part_of_speech",
      key: "part_of_speech",
      render: (pos) => (pos ? <Tag color="geekblue">{pos}</Tag> : "-"),
    },
    {
      title: "Ví dụ",
      dataIndex: "example_sentence",
      key: "example_sentence",
      render: (text) => <span style={{ color: "#555" }}>{text}</span>,
    },
    {
      title: "Dịch ví dụ",
      dataIndex: "example_translation",
      key: "example_translation",
      render: (text) => <span style={{ color: "#555" }}>{text}</span>,
    },
    {
      title: "Chủ đề",
      dataIndex: "topic_id",
      key: "topic_id",
      render: (id, record) => (
        <Tag color="blue">{id ? topicName(id) : record.topic || ""}</Tag>
      ),
    },
    {
      title: "Độ khó",
      dataIndex: "difficulty",
      key: "difficulty",
      render: (d) => {
        const color = d <= 2 ? "green" : d === 3 ? "orange" : "red";
        return <Tag color={color}>{d}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            aria-label="Chỉnh sửa" icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa từ vựng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="text" aria-label="Xóa" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record) => {
    setEditingWord(record);
    form.setFieldsValue({
      word: record.word,
      pronunciation: record.pronunciation,
      meaning: record.meaning,
      meaning_en: record.meaning_en,
      part_of_speech: record.part_of_speech,
      topic_id: record.topic_id || null,
      difficulty_level: record.difficulty,
      example_sentence: record.example_sentence,
      example_translation: record.example_translation,
      audio_url: record.audio_url,
      image_url: record.image_url,
      tags: record.tags,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/admin/vocabulary/${id}`);
      message.success("Xóa từ vựng thành công!");
      const data = await api.get("/admin/vocabulary");
      setVocabulary(Array.isArray(data) ? data.map(toUI) : []);
    } catch (e) {
      message.error("Xóa từ vựng thất bại");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const t = await api.get("/admin/vocabulary/topics");
      const sortedTopics = Array.isArray(t)
        ? t.sort((a, b) => (a.topic_id || 0) - (b.topic_id || 0))
        : [];
      setTopics(sortedTopics);
    } catch (e) {
      try {
        const cats = await api.get("/student/vocabulary/categories/list");
        const mappedTopics = Array.isArray(cats)
          ? cats.map((c) => ({ topic_id: null, name: c.category }))
          : [];
        setTopics(mappedTopics);
      } catch (e2) {
        setTopics([]);
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (!editingWord) {
        message.error("Chỉ có thể chỉnh sửa từ vựng, không thể thêm mới");
        return;
      }
      const payload = toPayload(values, editingWord);
      await api.put(`/admin/vocabulary/${editingWord.id}`, payload);
      message.success("Cập nhật từ vựng thành công!");
      const data = await api.get("/admin/vocabulary");
      setVocabulary(Array.isArray(data) ? data.map(toUI) : []);
      setIsModalVisible(false);
      form.resetFields();
    } catch (e) {
      message.error("Cập nhật từ vựng thất bại");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Topic management functions
  const handleAddTopic = () => {
    setEditingTopic(null);
    topicForm.resetFields();
    setIsTopicModalVisible(true);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    topicForm.setFieldsValue({
      name: topic.name,
    });
    setIsTopicModalVisible(true);
  };

  const handleDeleteTopic = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/admin/vocabulary/topics/${id}`);
      message.success("Xóa topic thành công!");
      // Reload topics
      await loadTopics();
    } catch (e) {
      const errorMsg =
        e?.response?.data?.error || e?.message || "Xóa topic thất bại";
      message.error(errorMsg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTopic = async (values) => {
    try {
      setLoading(true);
      if (editingTopic) {
        await api.put(
          `/admin/vocabulary/topics/${editingTopic.topic_id}`,
          values
        );
        message.success("Cập nhật topic thành công!");
      } else {
        await api.post("/admin/vocabulary/topics", values);
        message.success("Thêm topic thành công!");
      }
      // Reload topics
      await loadTopics();
      setIsTopicModalVisible(false);
      topicForm.resetFields();
    } catch (e) {
      const errorMsg =
        e?.response?.data?.error || e?.message || "Lưu topic thất bại";
      message.error(errorMsg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const topicColumns = [
    {
      title: "ID",
      dataIndex: "topic_id",
      key: "topic_id",
      width: 80,
      sorter: (a, b) => (a.topic_id || 0) - (b.topic_id || 0),
      defaultSortOrder: "ascend",
    },
    {
      title: "Tên Topic",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            aria-label="Chỉnh sửa" icon={<EditOutlined />}
            onClick={() => handleEditTopic(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa topic này?"
            description="Topic đang được sử dụng bởi từ vựng sẽ không thể xóa."
            onConfirm={() => handleDeleteTopic(record.topic_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="text" aria-label="Xóa" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>


      <Tabs
        defaultActiveKey="vocabulary"
        items={[
          {
            key: "vocabulary",
            label: "Từ vựng",
            children: (
              <Card>
                <Row
                  justify="space-between"
                  align="middle"
                  style={{ marginBottom: 16 }}
                >
                  <Col>
                    <Space>
                      <Upload
                        accept=".xlsx,.xls,.csv"
                        beforeUpload={handleImportVocabExcel}
                        showUploadList={false}
                      >
                        <Button>Nhập Excel</Button>
                      </Upload>
                      <Button
                        onClick={() => {
                          // Download template from public folder
                          window.open(
                            "/templates/vocabulary_template.xlsx",
                            "_blank"
                          );
                        }}
                      >
                        Tải mẫu
                      </Button>
                    </Space>
                  </Col>
                  <Col>
                    <Space.Compact style={{ width: 300 }}>
                      <Input
                        placeholder="Tìm kiếm từ vựng"
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                      <Button type="primary" aria-label="Tìm kiếm" icon={<SearchOutlined />} />
                    </Space.Compact>
                  </Col>
                </Row>

                <Table
                  columns={columns}
                  dataSource={vocabulary}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} của ${total} từ vựng`,
                  }}
                />
              </Card>
            ),
          },
          {
            key: "topics",
            label: "Quản lý Topics",
            children: (
              <Card>
                <Row
                  justify="space-between"
                  align="middle"
                  style={{ marginBottom: 16 }}
                >
                  <Col>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddTopic}
                    >
                      Thêm Topic mới
                    </Button>
                  </Col>
                </Row>
                <Table
                  columns={topicColumns}
                  dataSource={topics}
                  rowKey="topic_id"
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Tổng ${total} topics`,
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="Chỉnh sửa từ vựng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="word"
                label="Từ vựng"
                rules={[{ required: true, message: "Vui lòng nhập từ vựng!" }]}
              >
                <Input placeholder="Nhập từ vựng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pronunciation"
                label="Phiên âm"
                rules={[{ required: true, message: "Vui lòng nhập phiên âm!" }]}
              >
                <Input placeholder="Nhập phiên âm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="meaning"
            label="Nghĩa"
            rules={[{ required: true, message: "Vui lòng nhập nghĩa!" }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập nghĩa của từ" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="meaning_en" label="Nghĩa (EN)">
                <Input.TextArea rows={2} placeholder="English meaning" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="part_of_speech" label="Từ loại">
                <Select
                  placeholder="Chọn từ loại"
                  allowClear
                  options={[
                    { value: "noun", label: "noun" },
                    { value: "verb", label: "verb" },
                    { value: "adjective", label: "adjective" },
                    { value: "adverb", label: "adverb" },
                    { value: "pronoun", label: "pronoun" },
                    { value: "preposition", label: "preposition" },
                    { value: "conjunction", label: "conjunction" },
                    { value: "determiner", label: "determiner" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              {topics.length ? (
                <Form.Item
                  name="topic_id"
                  label="Chủ đề"
                  rules={[{ required: true, message: "Vui lòng chọn chủ đề!" }]}
                >
                  <Select
                    placeholder="Chọn chủ đề"
                    options={topics.map((t) => ({
                      value: t.topic_id,
                      label: t.name,
                    }))}
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="category"
                  label="Chủ đề"
                  rules={[{ required: true, message: "Vui lòng nhập chủ đề!" }]}
                >
                  <Input placeholder="Nhập chủ đề" />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              <Form.Item
                name="difficulty_level"
                label="Độ khó"
                rules={[{ required: true, message: "Vui lòng chọn độ khó!" }]}
              >
                <Select
                  placeholder="Chọn độ khó"
                  options={[1, 2, 3, 4, 5].map((d) => ({
                    value: d,
                    label: String(d),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="example_sentence" label="Ví dụ">
                <Input.TextArea rows={2} placeholder="Nhập câu ví dụ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="example_translation" label="Dịch ví dụ">
                <Input.TextArea
                  rows={2}
                  placeholder="Nhập bản dịch câu ví dụ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="audio_url" label="Audio URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="image_url" label="Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tags" label="Tags">
            <Select
              mode="tags"
              placeholder="Nhập tags và nhấn Enter"
              tokenSeparators={[","]}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Topic Management Modal */}
      <Modal
        title={editingTopic ? "Chỉnh sửa Topic" : "Thêm Topic mới"}
        open={isTopicModalVisible}
        onCancel={() => setIsTopicModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={topicForm} layout="vertical" onFinish={handleSubmitTopic}>
          <Form.Item
            name="name"
            label="Tên Topic"
            rules={[{ required: true, message: "Vui lòng nhập tên topic!" }]}
          >
            <Input placeholder="Ví dụ: Business, Technology, Travel..." />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsTopicModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingTopic ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Vocabulary;




