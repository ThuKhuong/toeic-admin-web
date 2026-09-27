import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Typography,
  Tag,
  message,
  Row,
  Col,
  Tabs,
  Modal,
  Alert,
  Form,
  Select,
  InputNumber,
  Upload,
} from "antd";
import {
  FileTextOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { questionsService } from "../services";
import { groupQuestionsByPassage, toUI } from "../utils/questionHelpers";
import { useQuestionImport } from "../hooks/useQuestionImport";
import PartTabContent from "../components/PartTabContent";
import PassageColumn from "../components/PassageColumn";
import EditGroupModal from "../components/EditGroupModal";

const { Title } = Typography;

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api$/, "");

const resolveImg = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}/${url.replace(/^\//, "")}`;
};

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("5");
  const [importResults, setImportResults] = useState({ 5: [], 6: [], 7: [] });
  const [importErrors, setImportErrors] = useState({ 5: [], 6: [], 7: [] });
  const [details, setDetails] = useState({});
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupedQuestions, setGroupedQuestions] = useState([]);
  const [loadingChoices, setLoadingChoices] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [editForm] = Form.useForm();

  // Use import hook
  const handleImportSuccess = useCallback((part, createdItems, errs) => {
    setImportResults((prev) => ({ ...prev, [part]: createdItems }));
    setImportErrors((prev) => ({ ...prev, [part]: errs }));
    setSearchText("");
    setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    setTimeout(() => {
      setImportResults((prev) => ({ ...prev, [part]: [] }));
      setImportErrors((prev) => ({ ...prev, [part]: [] }));
    }, 5000);
  }, []);

  const {
    previewVisible,
    previewRows,
    previewErrors,
    previewPart,
    pendingFile,
    loading: importLoading,
    openPreview,
    doImport,
    setPreviewVisible,
    setPendingFile,
  } = useQuestionImport(handleImportSuccess);

  const errorColumns = [
    { title: "Dòng", dataIndex: "row", key: "row", width: 80 },
    { title: "File / sheet", key: "source", render: (_, r) => [r.file, r.sheet].filter(Boolean).join(" / ") },
{ title: "Cột", dataIndex: "column", key: "column" },
{ title: "Lý do", key: "reason", render: (_, r) => r.error || r.reason },
  ];

  const handleEditGroup = (group) => {
    // Kiểm tra xem nhóm có nằm trong bài thi không
    if (group.test_id) {
      Modal.error({
        title: "Không thể sửa nhóm",
        content: `Nhóm này đã nằm trong bài thi "${
          group.test_name || "N/A"
        }" (ID: ${group.test_id}). 
      
Vui lòng xóa nhóm khỏi bài thi trước khi sửa, hoặc xóa nhóm và import lại.`,
        okText: "Đã hiểu",
      });
      return; // Không cho phép sửa
    }

    // Kiểm tra xem có câu hỏi nào trong nhóm đã nằm trong bài thi không
    const hasTestId = group.questions?.some((q) => q.test_id);
    if (hasTestId) {
      Modal.error({
        title: "Không thể sửa nhóm",
        content: `Một số câu hỏi trong nhóm này đã nằm trong bài thi. 
      
Vui lòng xóa nhóm khỏi bài thi trước khi sửa, hoặc xóa nhóm và import lại.`,
        okText: "Đã hiểu",
      });
      return; // Không cho phép sửa
    }

    // Cho phép sửa nếu không có ràng buộc
    setEditingGroup(group);
  };

  const handleUpdateGroup = (updatedGroup) => {
    setEditingGroup(updatedGroup);
  };

  const handleUpdateQuestion = (index, updatedQuestion) => {
    const newQuestions = [...editingGroup.questions];
    newQuestions[index] = updatedQuestion;
    setEditingGroup({
      ...editingGroup,
      questions: newQuestions,
    });
  };

  const handleUpdateChoice = (questionId, choiceLabel, choiceText) => {
    const newDetails = { ...details };
    if (!newDetails[questionId]) newDetails[questionId] = {};
    if (!newDetails[questionId].choices) {
      newDetails[questionId].choices = [...details[questionId].choices];
    }
    const choiceIndex = newDetails[questionId].choices.findIndex(
      (c) => c.choice_label === choiceLabel
    );
    if (choiceIndex >= 0) {
      newDetails[questionId].choices[choiceIndex].choice_text = choiceText;
      setDetails(newDetails);
    }
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !editingGroup.passage_id) {
      message.error("Không tìm thấy thông tin nhóm");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: editingGroup.passage_title,
        image_url: editingGroup.passage_image_url || null,
        difficulty_level: editingGroup.questions[0]?.difficulty || 2,
        questions: editingGroup.questions.map((q) => ({
          question_id: q.id,
          question_text: q.question_text,
          correct_answer: q.correct_answer,
          choices:
            details[q.id]?.choices?.map((c) => ({
              label: c.choice_label,
              text: c.choice_text,
            })) || [],
          explanation: q.explanation,
          difficulty_level: q.difficulty || 2,
        })),
      };

      await questionsService.updatePassageGroup(
        editingGroup.passage_id,
        payload
      );
      message.success("Cập nhật nhóm câu hỏi thành công");
      setEditingGroup(null);
      load();
    } catch (error) {
      console.error(error);
      message.error("Cập nhật nhóm câu hỏi thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = (group, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!group) {
      message.error("Không tìm thấy thông tin nhóm");
      return;
    }
    setDeleteTarget(group);
    setDeleteModalVisible(true);
  };

  const confirmDeleteGroup = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.passage_id) {
        await questionsService.deletePassageGroup(deleteTarget.passage_id);
        message.success(`Đã xóa nhóm ${deleteTarget.questions.length} câu hỏi`);
      } else {
        const deletePromises = deleteTarget.questions.map((q) =>
          questionsService.delete(q.id)
        );
        await Promise.all(deletePromises);
        message.success(`Đã xóa ${deleteTarget.questions.length} câu hỏi`);
      }
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      setPageError(null);
      load();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Không thể xóa nhóm câu hỏi";
      setPageError(errorMsg);
      message.error(errorMsg);
      Modal.error({ title: "Lỗi xóa nhóm", content: errorMsg });
    }
  };

  const handleEdit = async (record) => {
    // Kiểm tra xem câu hỏi có nằm trong bài thi không
    if (record.test_id) {
      Modal.error({
        title: "Không thể sửa câu hỏi",
        content: `Câu hỏi này đã nằm trong bài thi "${
          record.test_name || "N/A"
        }" (ID: ${record.test_id}). 
      
Vui lòng xóa câu hỏi khỏi bài thi trước khi sửa, hoặc xóa câu hỏi và import lại.`,
        okText: "Đã hiểu",
      });
      return; // Không cho phép sửa
    }

    try {
      // Load chi tiết câu hỏi (choices)
      const questionDetails = await questionsService.getById(record.id);
      const choices = questionDetails?.choices || [];

      // Set form values
      editForm.setFieldsValue({
        question_text: record.question_text || "",
        correct_answer: record.correct_answer || "",
        difficulty_level: record.difficulty || 2,
        explanation: questionDetails?.explanation || "",
        choiceA: choices.find((c) => c.choice_label === "A")?.choice_text || "",
        choiceB: choices.find((c) => c.choice_label === "B")?.choice_text || "",
        choiceC: choices.find((c) => c.choice_label === "C")?.choice_text || "",
        choiceD: choices.find((c) => c.choice_label === "D")?.choice_text || "",
      });

      setEditingRecord(record);
    } catch (error) {
      message.error("Không thể tải chi tiết câu hỏi");
      console.error(error);
    }
  };

  const handleSaveQuestion = async () => {
    try {
      const values = await editForm.validateFields();

      if (!editingRecord) {
        message.error("Không tìm thấy câu hỏi cần sửa");
        return;
      }

      const choices = [
        { label: "A", text: values.choiceA },
        { label: "B", text: values.choiceB },
        { label: "C", text: values.choiceC },
        { label: "D", text: values.choiceD },
      ];

      const payload = {
        question_text: values.question_text,
        correct_answer: values.correct_answer,
        difficulty_level: values.difficulty_level || 2,
        choices,
        explanation: values.explanation || null,
        // Part 5 không có hình ảnh
      };

      setLoading(true);
      await questionsService.update(editingRecord.id, payload);
      message.success("Cập nhật câu hỏi thành công");
      setEditingRecord(null);
      editForm.resetFields();
      load();
    } catch (error) {
      if (error?.errorFields) {
        // Validation errors
        return;
      }
      const errorMsg =
        error?.response?.data?.error ||
        error?.message ||
        "Cập nhật câu hỏi thất bại";
      const errorCode = error?.response?.data?.code;

      // Hiển thị lỗi chi tiết nếu có trong bài thi
      if (
        errorCode === "IN_TEST" ||
        errorMsg.includes("đang được sử dụng trong đề thi")
      ) {
        Modal.error({
          title: "Không thể sửa câu hỏi",
          content: errorMsg,
          okText: "Đã hiểu",
        });
      } else {
        message.error(errorMsg);
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    const questionId = record.id || record.question_id;
    if (!questionId) {
      message.error("Không tìm thấy ID câu hỏi");
      return;
    }
    try {
      await questionsService["delete"](questionId);
      message.success("Xóa câu hỏi thành công");
      setPageError(null);
      load();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.message ||
        "Không thể xóa câu hỏi";
      const msgStr = String(errorMsg);
      if (
        msgStr.includes("Không thể xóa") &&
        (msgStr.includes("đã nằm trong bài thi") ||
          msgStr.includes("đã nằm trong đề"))
      ) {
        setPageError(errorMsg);
        message.error("Câu hỏi này đã nằm trong đề thi, không xóa được");
        Modal.error({ title: "Lỗi xóa câu hỏi", content: errorMsg });
      } else if (
        msgStr.includes("Không thể xóa") &&
        msgStr.includes("đã có người làm")
      ) {
        setPageError(errorMsg);
        message.error(
          "Câu này đã có người làm. Vui lòng xóa kết quả làm bài trước"
        );
        Modal.error({ title: "Lỗi xóa câu hỏi", content: errorMsg });
      } else {
        setPageError(errorMsg);
        message.error(errorMsg);
        Modal.error({ title: "Lỗi xóa câu hỏi", content: errorMsg });
      }
    }
  };

  const getPassageColumns = () => [
    {
      title: "Đoạn văn và câu hỏi",
      key: "passage",
      render: (_, record) => (
        <PassageColumn
          record={record}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          details={details}
          loadingChoices={loadingChoices}
          resolveImg={resolveImg}
        />
      ),
    },
  ];

  const handleUpload = async (part, file) => {
    if (part === 5) {
      return openPreview(part, file);
    }
    return false;
  };

  const beforeUploadZipPart6 = async (part, file) => {
    try {
      setLoading(true);
      const res = await questionsService.importZipPart6(file);
      if (res.duplicate) { message.info('File này đã được nhập, không tạo bản sao.'); return false; }
      const createdItems = Array.isArray(res?.items) ? res.items : [];
      const errs = Array.isArray(res?.errors) ? res.errors : [];
      setImportResults((prev) => ({ ...prev, 6: createdItems }));
      setImportErrors((prev) => ({ ...prev, 6: errs }));
      message.success(
        `Import ZIP Part 6 thành công: ${res?.created || createdItems.length}/${
          res?.total || createdItems.length
        }`
      );
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      setImportResults((prev) => ({ ...prev, 6: [] }));
      setImportErrors((prev) => ({ ...prev, 6: e.response?.data?.errors || [] }));
      message.error(`Import ZIP Part 6 thất bại: ${e.message || "Unknown"}`);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const beforeUploadZipPart7 = async (part, file) => {
    try {
      setLoading(true);
      const res = await questionsService.importZipPart7(file);
      if (res.duplicate) { message.info('File này đã được nhập, không tạo bản sao.'); return false; }
      const createdItems = Array.isArray(res?.items) ? res.items : [];
      const errs = Array.isArray(res?.errors) ? res.errors : [];
      setImportResults((prev) => ({ ...prev, 7: createdItems }));
      setImportErrors((prev) => ({ ...prev, 7: errs }));
      message.success(
        `Import ZIP Part 7 thành công: ${res?.created || createdItems.length}/${
          res?.total || createdItems.length
        }`
      );
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      setImportResults((prev) => ({ ...prev, 7: [] }));
      setImportErrors((prev) => ({ ...prev, 7: e.response?.data?.errors || [] }));
      message.error(`Import ZIP Part 7 thất bại: ${e.message || "Unknown"}`);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const downloadZipPart6 = () => {
    const a = document.createElement("a");
    a.href = "/templates/toeic_part6_sample.zip?v=20260926-3";
    a.download = "toeic_part6_sample.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadZipPart7 = () => {
    const a = document.createElement("a");
    a.href = "/templates/toeic_part7_sample.zip?v=20260926-3";
    a.download = "toeic_part7_sample.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchText) params.search = searchText;
      params.part_number = Number(activeTab);

      const data = await questionsService.getAll({
        ...params,
        _t: Date.now(),
        limit: 100,
      });

      const mappedQuestions = Array.isArray(data) ? data.map(toUI) : [];
      setQuestions(mappedQuestions);

      if (activeTab === "6" || activeTab === "7") {
        const grouped = groupQuestionsByPassage(mappedQuestions);
        setGroupedQuestions(grouped);
      } else {
        setGroupedQuestions([]);
      }
    } catch (e) {
      message.error("Không thể tải danh sách câu hỏi");
    } finally {
      setLoading(false);
    }
  }, [searchText, activeTab]);

  // Load choices for grouped parts (6 & 7)
  useEffect(() => {
    if (
      (activeTab === "6" || activeTab === "7") &&
      groupedQuestions.length > 0
    ) {
      const loadQuestionDetails = async () => {
        const questionIds = groupedQuestions.flatMap((group) =>
          group.questions.map((q) => q.id)
        );
        const newDetails = {};
        const newLoading = {};

        for (const questionId of questionIds) {
          if (!details[questionId]) {
            newLoading[questionId] = true;
            try {
              const data = await questionsService.getById(questionId);
              newDetails[questionId] = data;
            } catch (error) {
              // Silent fail - question details not critical for display
            } finally {
              newLoading[questionId] = false;
            }
          }
        }

        if (Object.keys(newDetails).length > 0) {
          setDetails((prev) => ({ ...prev, ...newDetails }));
        }
        if (Object.keys(newLoading).length > 0) {
          setLoadingChoices((prev) => ({ ...prev, ...newLoading }));
        }
      };

      loadQuestionDetails();
    }
  }, [groupedQuestions, activeTab, details]);

  useEffect(() => {
    load();
  }, [activeTab, load, refreshKey]);

  // Clear cached data when switching parts
  useEffect(() => {
    setDetails({});
    setGroupedQuestions([]);
    setQuestions([]);
  }, [activeTab]);

  const columns = [
    {
      title: "Câu hỏi",
      dataIndex: "question_text",
      key: "question_text",
      render: (text, record) => (
        <div style={{ maxWidth: 600 }}>
          {text}
          {resolveImg(record.passage_image_url || record.image_url) ? (
            <div style={{ marginTop: 8 }}>
              <img
                src={resolveImg(record.passage_image_url || record.image_url)}
                alt="Hình"
                style={{
                  maxWidth: 140,
                  maxHeight: 140,
                  borderRadius: 4,
                  border: "1px solid #eee",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          ) : null}
        </div>
      ),
      sorter: (a, b) =>
        (a.question_text || "").localeCompare(b.question_text || ""),
    },
    {
      title: "Phần",
      dataIndex: "part_number",
      key: "part_number",
      align: "center",
      render: (p) => (
        <Tag color={p === 5 ? "blue" : p === 6 ? "purple" : "green"}>
          Part {p}
        </Tag>
      ),
      sorter: (a, b) => (a.part_number || 0) - (b.part_number || 0),
    },
    {
      title: "Test",
      dataIndex: "test_name",
      key: "test_name",
      sorter: (a, b) => (a.test_name || "").localeCompare(b.test_name || ""),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => {
        const hasTestId = record.test_id;
        const disabledTooltip = hasTestId
          ? `Không thể sửa: Câu hỏi đã nằm trong bài thi "${
              record.test_name || "N/A"
            }"`
          : "";

        return (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              ghost
              disabled={hasTestId}
              onClick={() => handleEdit(record)}
              title={hasTestId ? disabledTooltip : "Sửa câu hỏi"}
            >
              Sửa
            </Button>
            <Button size="small" danger onClick={() => handleDelete(record)}>
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div>


      <Card>
        <div className="bank-guide"><strong>Reading · Part 5–7</strong><span>Chọn Part để quản lý câu hỏi độc lập, đoạn văn và nhóm bài đọc.</span></div>
        {pageError && (
          <Alert
            type="error"
            message={pageError}
            showIcon
            closable
            onClose={() => setPageError(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Space>
              <Space.Compact style={{ width: 320 }}>
                <Input
                  placeholder="Tìm theo nội dung câu hỏi"
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={() => load()}
                />
                <Button aria-label="Tìm kiếm" icon={<SearchOutlined />} onClick={() => load()} />
              </Space.Compact>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText("");
                  setRefreshKey((prev) => prev + 1);
                }}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
          <Col>
            <Space />
          </Col>
        </Row>

        <Card style={{ marginBottom: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "5",
                label: "Part 5",
                children: (
                  <PartTabContent
                    part={5}
                    importErrors={importErrors[5]}
                    importResults={importResults[5]}
                    onUpload={handleUpload}
                    errorColumns={errorColumns}
                  />
                ),
              },
              {
                key: "6",
                label: "Part 6",
                children: (
                  <PartTabContent
                    part={6}
                    importErrors={importErrors[6]}
                    importResults={importResults[6]}
                    onUpload={beforeUploadZipPart6}
                    onDownloadZip={downloadZipPart6}
                    errorColumns={errorColumns}
                  />
                ),
              },
              {
                key: "7",
                label: "Part 7",
                children: (
                  <PartTabContent
                    part={7}
                    importErrors={importErrors[7]}
                    importResults={importResults[7]}
                    onUpload={beforeUploadZipPart7}
                    onDownloadZip={downloadZipPart7}
                    errorColumns={errorColumns}
                  />
                ),
              },
            ]}
          />
        </Card>

        <Modal
          title={`Preview Import Part ${previewPart}`}
          open={previewVisible}
          onCancel={() => {
            setPreviewVisible(false);
            setPendingFile(null);
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setPreviewVisible(false);
                setPendingFile(null);
              }}
            >
              Hủy
            </Button>,
            <Button
              key="import"
              type="primary"
              onClick={doImport}
              disabled={previewErrors.length > 0}
            >
              Import
            </Button>,
          ]}
          width={900}
        >
          {previewRows.length > 0 && (
            <Card
              size="small"
              title={`Câu hỏi hợp lệ (${previewRows.length})`}
              style={{ marginBottom: 12 }}
            >
              <div style={{ color: "#52c41a" }}>
                Đã tìm thấy {previewRows.length} câu hỏi hợp lệ trong file
              </div>
            </Card>
          )}
          {previewErrors.length > 0 && (
            <Card
              size="small"
              title={`Lỗi phát hiện (${previewErrors.length})`}
            >
              <Table
                size="small"
                columns={errorColumns}
                dataSource={previewErrors}
                pagination={false}
                rowKey={(r) => r?.row ?? `${r?.row}-${r?.reason}`}
              />
            </Card>
          )}
        </Modal>

        <EditGroupModal
          editingGroup={editingGroup}
          visible={editingGroup !== null}
          onCancel={() => setEditingGroup(null)}
          onSave={handleSaveGroup}
          details={details}
          onUpdateGroup={handleUpdateGroup}
          onUpdateQuestion={handleUpdateQuestion}
          onUpdateChoice={handleUpdateChoice}
        />

        <Table
          columns={
            activeTab === "6" || activeTab === "7"
              ? getPassageColumns()
              : columns
          }
          dataSource={
            activeTab === "6" || activeTab === "7"
              ? groupedQuestions
              : questions
          }
          rowKey={(record) =>
            activeTab === "6" || activeTab === "7"
              ? `passage-${record.passage_title || "no-title"}-${(
                  record.passage_content || ""
                ).substring(0, 50)}`
              : record.id
          }
          loading={loading}
          expandedRowRender={
            activeTab === "6" || activeTab === "7"
              ? null
              : (record) => {
                  const d = details[record.id];
                  const hasPassage = Boolean(
                    record.passage_title || record.passage_content
                  );
                  return (
                    <div>
                      {hasPassage && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>
                            {record.passage_title || "Đoạn văn"}
                          </div>
                          <div>{record.passage_content}</div>
                        </div>
                      )}
                      <div>
                        Đáp án đúng:{" "}
                        <Tag color="blue">{record.correct_answer}</Tag>
                      </div>
                      {Array.isArray(d?.choices) && (
                        <div style={{ marginTop: 8 }}>
                          {d.choices.map((c) => (
                            <div key={c.choice_label}>
                              <Tag
                                color={
                                  c.choice_label ===
                                  (d.correct_answer || record.correct_answer)
                                    ? "green"
                                    : undefined
                                }
                              >
                                {c.choice_label}
                              </Tag>{" "}
                              {c.choice_text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
          }
          onExpand={async (expanded, record) => {
            if (expanded && !details[record.id]) {
              try {
                const data = await questionsService.getById(record.id);
                setDetails((prev) => ({ ...prev, [record.id]: data }));
              } catch (error) {
                // Silent fail - question details not critical for display
              }
            }
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} câu hỏi`,
          }}
          defaultSortOrder={[{ field: "id", order: "descend" }]}
        />
      </Card>

      <Modal
        title="Xác nhận xóa nhóm"
        open={deleteModalVisible}
        onOk={confirmDeleteGroup}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteTarget(null);
        }}
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
      >
        {deleteTarget && (
          <p>
            Bạn có chắc chắn muốn xóa nhóm{" "}
            <strong>{deleteTarget.questions?.length || 0}</strong> câu hỏi
            không?
          </p>
        )}
      </Modal>

      <Modal
        title="Sửa câu hỏi Part 5"
        open={editingRecord !== null}
        onCancel={() => {
          setEditingRecord(null);
          editForm.resetFields();
        }}
        onOk={handleSaveQuestion}
        width={700}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        {editingRecord && (
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="question_text"
              label="Nội dung câu hỏi"
              rules={[
                { required: true, message: "Vui lòng nhập nội dung câu hỏi" },
              ]}
            >
              <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi" />
            </Form.Item>

            <Form.Item
              name="correct_answer"
              label="Đáp án đúng"
              rules={[{ required: true, message: "Vui lòng chọn đáp án đúng" }]}
            >
              <Select placeholder="Chọn đáp án đúng">
                <Select.Option value="A">A</Select.Option>
                <Select.Option value="B">B</Select.Option>
                <Select.Option value="C">C</Select.Option>
                <Select.Option value="D">D</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="choiceA"
              label="Phương án A"
              rules={[{ required: true, message: "Vui lòng nhập phương án A" }]}
            >
              <Input placeholder="Nhập phương án A" />
            </Form.Item>

            <Form.Item
              name="choiceB"
              label="Phương án B"
              rules={[{ required: true, message: "Vui lòng nhập phương án B" }]}
            >
              <Input placeholder="Nhập phương án B" />
            </Form.Item>

            <Form.Item
              name="choiceC"
              label="Phương án C"
              rules={[{ required: true, message: "Vui lòng nhập phương án C" }]}
            >
              <Input placeholder="Nhập phương án C" />
            </Form.Item>

            <Form.Item
              name="choiceD"
              label="Phương án D"
              rules={[{ required: true, message: "Vui lòng nhập phương án D" }]}
            >
              <Input placeholder="Nhập phương án D" />
            </Form.Item>

            <Form.Item name="explanation" label="Giải thích">
              <Input.TextArea
                rows={2}
                placeholder="Nhập giải thích (tùy chọn)"
              />
            </Form.Item>

            <Form.Item name="difficulty_level" label="Độ khó" initialValue={2}>
              <InputNumber min={1} max={5} style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Questions;





