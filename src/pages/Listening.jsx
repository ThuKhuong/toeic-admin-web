import React, { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Button,
  Space,
  Upload,
  message,
  Table,
  Tag,
  Spin,
  Modal,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  PlayCircleOutlined,
  AudioOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { listeningService } from "../services";

const Listening = () => {
  const [loading, setLoading] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const [questions, setQuestions] = useState({
    1: [],
    2: [],
    3: [],
    4: [],
  });

  const [currentPart, setCurrentPart] = useState(1);
  const [importVisible, setImportVisible] = useState(false);
  const [importResult, setImportResult] = useState({
    created: 0,
    total: 0,
    errors: [],
    items: [],
  });
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pagination, setPagination] = useState({
    1: { current: 1, pageSize: 10 },
    2: { current: 1, pageSize: 10 },
    3: { current: 1, pageSize: 10 },
    4: { current: 1, pageSize: 10 },
  });
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const API_ROOT = API_URL.replace(/\/api$/, "");
  const resolveMediaUrl = (u) => {
    if (!u) return "";
    const s = String(u);
    if (
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("data:")
    )
      return s;
    if (s.startsWith("/uploads")) return `${API_ROOT}${s}`;
    return s;
  };
  const isPublicUrl = (u) => {
    if (!u) return false;
    const s = String(u);
    return (
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("data:") ||
      s.startsWith("/uploads")
    );
  };
  const downloadSampleZip = (part) => {
    const filename = part
      ? `toeic_listening_part${part}_sample.zip`
      : "toeic_listening_sample.zip";
    const a = document.createElement("a");
    a.href = `/templates/${filename}?v=20260926-3`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Tai cau hoi cho tung part
  const loadQuestions = async (part) => {
    setLoading((prev) => ({ ...prev, [part]: true }));
    try {
      const response = await listeningService.getQuestionsGrouped(part, {
        limit: 100,
      });

      // Nhan response vao bien rows
      let rows = [];
      if (Array.isArray(response)) {
        rows = response;
      } else if (Array.isArray(response?.data)) {
        rows = response.data;
      } else if (Array.isArray(response?.items)) {
        rows = response.items;
      } else {
        console.warn(`Part ${part}: Unexpected response format`, response);
        rows = [];
      }
      setQuestions((prev) => {
        return { ...prev, [part]: rows };
      });
    } catch (error) {
      try {
        const fallback = await listeningService.getQuestionsByPart(part, {
          limit: 100,
        });
        const rows = Array.isArray(fallback)
          ? fallback
          : Array.isArray(fallback?.data)
            ? fallback.data
            : Array.isArray(fallback?.items)
              ? fallback.items
              : [];
        setQuestions((prev) => ({ ...prev, [part]: rows }));
      } catch (e2) {
        message.error(`Không thể tải câu hỏi Part ${part}`);
      }
    } finally {
      setLoading((prev) => ({ ...prev, [part]: false }));
    }
  };

  useEffect(() => {
    // Load all parts initially
    [1, 2, 3, 4].forEach((part) => loadQuestions(part));
  }, []);

  // Cleanup: dừng audio khi component unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

  const handleTabChange = (activeKey) => {
    const part = parseInt(activeKey);
    // Luôn reload khi chuyển tab để đảm bảo data mới nhất
    // Clear cache trước khi load để force reload
    setQuestions((prev) => ({ ...prev, [part]: [] }));
    loadQuestions(part);
  };

  const playAudio = (audioUrl) => {
    if (!audioUrl) {
      message.warning("Không có file audio");
      return;
    }

    // Nếu đang phát cùng một audio, dừng lại
    if (playingAudioUrl === audioUrl && currentAudio) {
      stopAudio();
      return;
    }

    // Dừng audio cũ nếu có
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Tạo và phát audio mới
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      message.error("Không thể phát audio");
      console.error("Audio play error:", error);
      setCurrentAudio(null);
      setPlayingAudioUrl(null);
    });

    // Lưu audio object và URL
    setCurrentAudio(audio);
    setPlayingAudioUrl(audioUrl);

    // Khi audio kết thúc, reset state
    audio.addEventListener("ended", () => {
      setCurrentAudio(null);
      setPlayingAudioUrl(null);
    });

    // Khi có lỗi, reset state
    audio.addEventListener("error", () => {
      setCurrentAudio(null);
      setPlayingAudioUrl(null);
    });
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingAudioUrl(null);
    }
  };

  const beforeUploadZip = async (file) => {
    try {
      const resp = await listeningService.importQuestionsZip(file);
      const res =
        Array.isArray(resp?.data) || typeof resp?.data === "object"
          ? resp.data || resp
          : resp;
      setImportResult({
        created: res.created || 0, skipped: res.skipped || 0,
        total: res.total || 0,
        errors: res.errors || [],
        items: res.items || [],
        missing_images: res.missing_images || 0,
        missing_audios: res.missing_audios || 0,
      });
      setImportVisible(true);

      // Đợi 1 giây để đảm bảo database đã commit xong, sau đó reload tất cả parts
      setTimeout(() => {
        [1, 2, 3, 4].forEach((part) => {
          // Clear cache bằng cách set state rỗng trước
          setQuestions((prev) => ({ ...prev, [part]: [] }));
          // Sau đó load lại
          setTimeout(() => {
            loadQuestions(part);
          }, 100 * part); // Stagger requests để tránh race condition
        });
      }, 1000);

      message.success(res.duplicate ? "File này đã được nhập, không tạo bản sao." : `Đã import ZIP thành công: ${res.created || 0} câu hỏi`);
    } catch (e) {
      if (e.response?.data?.errors) { setImportResult(e.response.data); setImportVisible(true); }
      console.error("Import ZIP error:", e);
      message.error(
        "Import ZIP thất bại: " + (e.message || "Lỗi không xác định"),
      );
    }
    return false;
  };

  const deleteQuestion = async (id, part) => {
    try {
      await listeningService.deleteQuestion(id);
      await loadQuestions(part);
      message.success("Đã xóa câu hỏi");
    } catch (e) {
      const errorMsg =
        e?.response?.data?.error || e?.message || "Xóa câu hỏi thất bại";

      // Hiển thị lỗi chi tiết nếu có trong bài thi
      if (
        errorMsg.includes("đang được sử dụng trong đề thi") ||
        errorMsg.includes("đã nằm trong bài thi")
      ) {
        Modal.error({
          title: "Không thể xóa câu hỏi",
          content: errorMsg,
          okText: "Đã hiểu",
        });
      } else {
        message.error(errorMsg);
      }
      console.error(e);
    }
  };

  const deleteMaterial = async (materialId, part) => {
    if (!materialId) {
      message.error("Không tìm thấy material_id");
      throw new Error("Material ID is required");
    }

    try {
      await listeningService.deleteMaterial(materialId);

      // Clear cache bằng cách set state rỗng trước
      setQuestions((prev) => {
        return { ...prev, [part]: [] };
      });

      // Đợi một chút để đảm bảo state đã update
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Reset pagination về trang 1
      setPagination((prev) => ({
        ...prev,
        [part]: { current: 1, pageSize: prev[part]?.pageSize || 10 },
      }));

      // Reload questions
      await loadQuestions(part);

      // Đợi thêm một chút để đảm bảo data đã load xong
      await new Promise((resolve) => setTimeout(resolve, 300));

      message.success("Đã xóa material và tất cả câu hỏi liên quan");
    } catch (e) {
      // Xử lý lỗi từ API interceptor (đã được transform thành Error object)
      let errorMsg = "Xóa material thất bại";

      if (e.message) {
        errorMsg = e.message;
      } else if (e.response?.data?.error) {
        errorMsg = e.response.data.error;
      } else if (typeof e === "string") {
        errorMsg = e;
      }

      // Hiển thị message phù hợp
      if (
        errorMsg.includes("đang được sử dụng trong") ||
        errorMsg.includes("đã nằm trong bài thi")
      ) {
        Modal.error({
          title: "Không thể xóa material",
          content: errorMsg,
          okText: "Đã hiểu",
        });
      } else if (
        errorMsg.includes("not found") ||
        errorMsg.includes("không tồn tại")
      ) {
        message.error("Material không tồn tại");
      } else {
        message.error("Xóa material thất bại: " + errorMsg);
      }

      // Re-throw để caller có thể xử lý
      throw e;
    }
  };

  // Columns for Part 1 & 2 (individual questions)
  const getIndividualColumns = (part) => [
    ...(part === 1
      ? [
          {
            title: "Hình ảnh",
            key: "image",
            width: 180,
            className: "listening-part1__image-column",
            render: (_, record) =>
              isPublicUrl(record.image_url) ? (
                <img
                  src={resolveMediaUrl(record.image_url)}
                  alt="Photograph"
                  className="listening-part1__image"
                  style={{
                    display: "block",
                  }}
                />
              ) : (
                <Tag color="red">Thiếu ảnh</Tag>
              ),
          },
        ]
      : []),
    // Ẩn cột "Câu hỏi" cho Part 1 vì Part 1 không có câu hỏi text
    ...(part !== 1
      ? [
          {
            title: "Câu hỏi",
            dataIndex: "question_text",
            key: "question_text",
            render: (text) => text || "Không có nội dung",
          },
        ]
      : []),
    {
      title: "Audio",
      key: "audio",
      width: 220,
      align: "center",
      render: (_, record, index) => {
        // Chỉ hiển thị nút audio ở câu hỏi đầu tiên của nhóm (cùng audio_url)
        // Đối với Part 1, kiểm tra xem có câu hỏi nào trước đó có cùng audio_url không
        if (part === 1) {
          const currentAudioUrl = record.audio_url;
          const questionList = questions[part] || [];
          const isFirstInGroup = !questionList.some(
            (q, idx) => idx < index && q.audio_url === currentAudioUrl,
          );

          if (!isFirstInGroup) {
            // Không phải câu hỏi đầu tiên trong nhóm, hiển thị text thay vì nút
            return <Tag color="default">Cùng audio</Tag>;
          }
        }

        const audioUrl = resolveMediaUrl(record.audio_url);
        const isPlaying = playingAudioUrl === audioUrl;
        return (
          <Tooltip title={isPlaying ? "Dừng" : "Phát"}>
            <Button
              icon={isPlaying ? <PauseOutlined /> : <AudioOutlined />}
              size="small"
              onClick={() => playAudio(audioUrl)}
              disabled={!isPublicUrl(record.audio_url)}
              type={isPlaying ? "primary" : "default"}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Đáp án đúng",
      key: "correct_answer",
      width: 180,
      align: "center",
      render: (_, record) => <Tag color="green">{record.correct_answer}</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "right",
      render: (_, record) => {
        const hasTestId = record.test_id;
        const disabledTooltip = hasTestId
          ? `Không thể xóa: Câu hỏi đã nằm trong bài thi "${
              record.test_name || "N/A"
            }"`
          : "";

        return (
          <Space>
            {/* Part 1 và Part 2 không có nút Sửa, chỉ có nút Xóa */}
            <Tooltip title={hasTestId ? disabledTooltip : "Xóa câu hỏi"}>
              <Button
                size="small"
                danger
                disabled={hasTestId}
                onClick={() =>
                  deleteQuestion(record.question_id, record.part_number || part)
                }
              >
                Xóa
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Columns for Part 3 & 4 (grouped questions)
  const getGroupedColumns = () => [
    {
      title: "Tên đoạn hội thoại/bài nói",
      dataIndex: "material_title",
      key: "material_title",
      render: (text) => text || "Không có tiêu đề",
    },
    {
      title: "Số câu hỏi",
      key: "question_count",
      render: (_, record) => (
        <Tag color="blue">{record.questions?.length || 0} câu</Tag>
      ),
    },
    {
      title: "Audio",
      key: "audio",
      render: (_, record) => {
        const audioUrl = resolveMediaUrl(record.audio_url);
        const isPlaying = playingAudioUrl === audioUrl;
        return (
          <Tooltip title={isPlaying ? "Dừng" : "Phát"}>
            <Button
              icon={isPlaying ? <PauseOutlined /> : <AudioOutlined />}
              size="small"
              onClick={() => playAudio(audioUrl)}
              disabled={!isPublicUrl(record.audio_url)}
              type={isPlaying ? "primary" : "default"}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => {
        // Kiểm tra xem có câu hỏi nào trong material này đã nằm trong bài thi không
        const hasQuestionInTest =
          record.questions?.some((q) => q.test_id) || record.test_id;
        const disabledTooltip = hasQuestionInTest
          ? "Không thể xóa: Material này có câu hỏi đã nằm trong bài thi"
          : "";

        const handleDelete = () => {
          if (!record.material_id) {
            message.error("Không tìm thấy material_id");
            return;
          }
          setDeleteTarget(record);
          setDeleteModalVisible(true);
        };

        return (
          <Space>
            <Tooltip
              title={hasQuestionInTest ? disabledTooltip : "Xóa material"}
            >
              <Button
                size="small"
                danger
                disabled={hasQuestionInTest}
                onClick={handleDelete}
              >
                Xóa
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const renderPart1 = () => (
    <div className="listening-part1">
      <div className="listening-part1__toolbar">
        <Upload
          accept=".zip"
          beforeUpload={beforeUploadZip}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Import ZIP Excel</Button>
        </Upload>
        <Button onClick={() => downloadSampleZip(1)}>Tải ZIP mẫu</Button>
      </div>
      <Table
        className="listening-part1__table"
        dataSource={questions[1]}
        rowKey="question_id"
        columns={getIndividualColumns(1)}
        loading={loading[1]}
        rowClassName="listening-part1__row"
        pagination={{
          ...pagination[1],
          onChange: (page, pageSize) => {
            setPagination((prev) => ({
              ...prev,
              1: { current: page, pageSize },
            }));
          },
        }}
        locale={{
          emptyText:
            !questions[1].length && !loading[1]
              ? "Chưa có dữ liệu. Vui lòng import ZIP Excel."
              : "Đang tải...",
        }}
      />
    </div>
  );

  const renderPart2 = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Upload
          accept=".zip"
          beforeUpload={beforeUploadZip}
          showUploadList={false}
        >
          <Button style={{ marginLeft: 8 }} icon={<UploadOutlined />}>
            Import ZIP Excel
          </Button>
        </Upload>
        <Button style={{ marginLeft: 8 }} onClick={() => downloadSampleZip(2)}>
          Tải ZIP mẫu
        </Button>
      </div>
      <Table
        dataSource={questions[2]}
        rowKey="question_id"
        columns={getIndividualColumns(2)}
        loading={loading[2]}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const renderPart3 = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Upload
          accept=".zip"
          beforeUpload={beforeUploadZip}
          showUploadList={false}
        >
          <Button style={{ marginLeft: 8 }} icon={<UploadOutlined />}>
            Import ZIP Excel
          </Button>
        </Upload>
        <Button style={{ marginLeft: 8 }} onClick={() => downloadSampleZip(3)}>
          Tải ZIP mẫu
        </Button>
      </div>
      <Table
        dataSource={questions[3] || []}
        rowKey={(record) =>
          record.material_id || `material-${record.material_title || "unknown"}`
        }
        columns={getGroupedColumns()}
        loading={loading[3]}
        pagination={{
          ...pagination[3],
          onChange: (page, pageSize) => {
            setPagination((prev) => ({
              ...prev,
              3: { current: page, pageSize },
            }));
          },
        }}
        locale={{
          emptyText:
            (!questions[3] || questions[3].length === 0) && !loading[3]
              ? "Chưa có dữ liệu. Vui lòng import ZIP Excel."
              : "Đang tải...",
        }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ margin: 0 }}>
              {record.questions?.map((question, index) => (
                <Card
                  key={question.question_id}
                  size="small"
                  style={{ marginBottom: 8 }}
                >
                  <div>
                    <strong>Câu {index + 1}:</strong> {question.question_text}
                  </div>
                  {/* Hiển thị ảnh nếu có */}
                  {question.image_url && isPublicUrl(question.image_url) && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={resolveMediaUrl(question.image_url)}
                        alt="Question image"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 300,
                          borderRadius: 4,
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    {question.choices?.map((choice) => (
                      <Tag
                        key={choice.choice_label}
                        color={
                          choice.choice_label === question.correct_answer
                            ? "green"
                            : "default"
                        }
                        style={{ marginRight: 8 }}
                      >
                        {choice.choice_label}: {choice.choice_text}
                      </Tag>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ),
        }}
      />
    </div>
  );

  const renderPart4 = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Upload
          accept=".zip"
          beforeUpload={beforeUploadZip}
          showUploadList={false}
        >
          <Button style={{ marginLeft: 8 }} icon={<UploadOutlined />}>
            Import ZIP Excel
          </Button>
        </Upload>
        <Button style={{ marginLeft: 8 }} onClick={() => downloadSampleZip(4)}>
          Tải ZIP mẫu
        </Button>
      </div>
      <Table
        dataSource={questions[4]}
        rowKey="material_id"
        columns={getGroupedColumns()}
        loading={loading[4]}
        pagination={{
          ...pagination[4],
          onChange: (page, pageSize) => {
            setPagination((prev) => ({
              ...prev,
              4: { current: page, pageSize },
            }));
          },
        }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ margin: 0 }}>
              {record.questions?.map((question, index) => (
                <Card
                  key={question.question_id}
                  size="small"
                  style={{ marginBottom: 8 }}
                >
                  <div>
                    <strong>Câu {index + 1}:</strong> {question.question_text}
                  </div>
                  {/* Hiển thị ảnh nếu có */}
                  {question.image_url && isPublicUrl(question.image_url) && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={resolveMediaUrl(question.image_url)}
                        alt="Question image"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 300,
                          borderRadius: 4,
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    {question.choices?.map((choice) => (
                      <Tag
                        key={choice.choice_label}
                        color={
                          choice.choice_label === question.correct_answer
                            ? "green"
                            : "default"
                        }
                        style={{ marginRight: 8 }}
                      >
                        {choice.choice_label}: {choice.choice_text}
                      </Tag>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ),
        }}
      />
    </div>
  );

  return (
    <div className="question-bank-page">
      <Card>
        <div className="bank-guide"><strong>Listening · Part 1–4</strong><span>Tải ZIP mẫu, giải nén và đọc HUONG_DAN.txt. Sửa Excel, thay ảnh/audio rồi nén lại để import. Audio mẫu chỉ là tiếng bíp, cần thay bằng bài nghe thật.</span></div>
        <Tabs
          defaultActiveKey="1"
          onChange={handleTabChange}
          onTabClick={(activeKey) => {
            const part = parseInt(activeKey);
            loadQuestions(part);
          }}
          items={[
            {
              key: "1",
              label: "Part 1 - Photographs",
              children: renderPart1(),
            },
            {
              key: "2",
              label: "Part 2 - Question & Response",
              children: renderPart2(),
            },
            {
              key: "3",
              label: "Part 3 - Conversations",
              children: renderPart3(),
            },
            {
              key: "4",
              label: "Part 4 - Talks",
              children: renderPart4(),
            },
          ]}
        />

        <Modal
          open={importVisible}
          title={"Kết quả import"}
          onCancel={() => setImportVisible(false)}
          onOk={() => setImportVisible(false)}
        >
          <div>
            <div>Tổng: {importResult.total}</div>
            <div>Thành công: {importResult.created} · Đã nhập trước đó: {importResult.skipped || 0}</div>
            <div>Lỗi: {importResult.errors?.length || 0}</div>
            <div>Thiếu ảnh: {importResult.missing_images || 0}</div>
            <div>Thiếu audio: {importResult.missing_audios || 0}</div>
            {importResult.errors?.length ? (
              <div style={{ maxHeight: 240, overflow: "auto", marginTop: 8 }}>
                {importResult.errors.map((e, idx) => (
                  <Card key={idx} size="small" style={{ marginBottom: 8 }}>
                    <div>{e.file} · {e.sheet} · Dòng {e.row ?? e.index ?? idx} · Cột {e.column}</div>
                    <div>Lỗi: {String(e.error || "")}</div>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Xác nhận xóa"
          open={deleteModalVisible}
          onOk={async () => {
            if (!deleteTarget) return;
            try {
              const part = deleteTarget.questions?.[0]?.part_number || 3;
              await deleteMaterial(deleteTarget.material_id, part);
              setDeleteModalVisible(false);
              setDeleteTarget(null);
            } catch (error) {
              // Error đã được xử lý trong deleteMaterial
              console.error("Delete failed:", error);
            }
          }}
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
              Bạn có chắc chắn muốn xóa material "
              {deleteTarget.material_title || "Part 3"}" và tất cả{" "}
              {deleteTarget.questions?.length || 0} câu hỏi liên quan?
            </p>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default Listening;


