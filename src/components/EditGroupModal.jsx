import React, { useState, useEffect } from "react";
import { Modal, Input, Card, Upload, Button, message } from "antd";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api$/, "");

const resolveImg = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("data:image")) return url; // Base64
  return `${API_BASE}/${url.replace(/^\//, "")}`;
};

/**
 * Modal component để sửa nhóm đoạn văn và câu hỏi (Part 6 & 7)
 */
const EditGroupModal = ({
  editingGroup,
  visible,
  onCancel,
  onSave,
  details = {},
  onUpdateGroup,
  onUpdateQuestion,
  onUpdateChoice,
}) => {
  const [imagePreview, setImagePreview] = useState("");

  // Sync imagePreview với editingGroup khi group thay đổi
  useEffect(() => {
    if (editingGroup?.passage_image_url) {
      setImagePreview(resolveImg(editingGroup.passage_image_url));
    } else {
      setImagePreview("");
    }
  }, [editingGroup?.passage_image_url]);

  if (!editingGroup) return null;

  const beforeUploadImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setImagePreview(base64);
      onUpdateGroup({
        ...editingGroup,
        passage_image_url: base64,
      });
      message.success("Đã chọn ảnh");
    };
    reader.onerror = () => message.error("Không thể đọc file ảnh");
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Modal
      title="Sửa nhóm đoạn văn và câu hỏi"
      open={visible}
      onCancel={onCancel}
      onOk={onSave}
      width={900}
      okText="Lưu"
      cancelText="Hủy"
    >
      <div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Tiêu đề đoạn văn:
          </label>
          <Input
            value={editingGroup.passage_title || ""}
            onChange={(e) =>
              onUpdateGroup({
                ...editingGroup,
                passage_title: e.target.value,
              })
            }
            placeholder="Nhập tiêu đề đoạn văn"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Hình ảnh đoạn văn:
          </label>
          <Upload
            accept="image/*"
            beforeUpload={beforeUploadImage}
            showUploadList={false}
          >
            <Button>Chọn ảnh từ thiết bị</Button>
          </Upload>
          {imagePreview ? (
            <div style={{ marginTop: 8 }}>
              <img
                src={imagePreview}
                alt="preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 4,
                  border: "1px solid #d9d9d9",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                marginTop: 8,
                padding: 16,
                border: "1px dashed #d9d9d9",
                borderRadius: 4,
                textAlign: "center",
                color: "#999",
              }}
            >
              Chưa có hình ảnh
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Câu hỏi ({editingGroup.questions.length} câu):
          </label>
          {editingGroup.questions.map((q, index) => (
            <Card
              key={q.id}
              size="small"
              style={{ marginBottom: 12 }}
              title={`Câu ${index + 1}`}
            >
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  Nội dung câu hỏi:
                </label>
                <Input
                  value={q.question_text || ""}
                  onChange={(e) =>
                    onUpdateQuestion(index, {
                      ...q,
                      question_text: e.target.value,
                    })
                  }
                  placeholder="Nhập nội dung câu hỏi"
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  Đáp án đúng:
                </label>
                <Input
                  value={q.correct_answer || ""}
                  onChange={(e) =>
                    onUpdateQuestion(index, {
                      ...q,
                      correct_answer: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="A, B, C, hoặc D"
                  maxLength={1}
                  style={{ width: 100 }}
                />
              </div>

              {details[q.id]?.choices && details[q.id].choices.length > 0 && (
                <div>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    Lựa chọn:
                  </label>
                  {details[q.id].choices.map((choice) => (
                    <div key={choice.choice_label} style={{ marginBottom: 4 }}>
                      <Input
                        value={choice.choice_text || ""}
                        onChange={(e) =>
                          onUpdateChoice(
                            q.id,
                            choice.choice_label,
                            e.target.value
                          )
                        }
                        addonBefore={choice.choice_label}
                        placeholder={`Nhập lựa chọn ${choice.choice_label}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default EditGroupModal;
