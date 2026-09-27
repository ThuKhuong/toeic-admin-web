import React from "react";
import { Card, Tag, Button, Space } from "antd";

/**
 * Component to render passage column for Part 6 & 7
 */
const PassageColumn = ({
  record,
  onEditGroup,
  onDeleteGroup,
  details = {},
  loadingChoices = {},
  resolveImg,
}) => {
  // Kiểm tra xem nhóm có nằm trong bài thi không
  const isInTest = record.test_id || record.questions?.some((q) => q.test_id);

  return (
    <div style={{ maxWidth: 800 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {record.passage_title && (
            <div style={{ fontWeight: "bold", fontSize: 16 }}>
              {record.passage_title}
            </div>
          )}
        </div>
        {/* Tag test được căn chỉnh sang phải với các hành động */}
        <Space align="start">
          <Tag color="geekblue">{record.test_name || "Chưa gán test"}</Tag>
          <Button
            size="small"
            type="primary"
            ghost
            disabled={isInTest}
            onClick={() => onEditGroup(record)}
            title={isInTest ? "Không thể sửa nhóm đã nằm trong bài thi" : ""}
          >
            Sửa nhóm
          </Button>
          <Button
            size="small"
            danger
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteGroup(record, e);
            }}
          >
            Xóa nhóm
          </Button>
        </Space>
      </div>

      {/* Hiển thị văn bản passage (Part 6 & 7) */}
      {record.passage_content && (
        <div style={{ marginBottom: 16, lineHeight: 1.8, fontSize: 15 }}>
          {record.passage_content.split("_____").map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < record.passage_content.split("_____").length - 1 && (
                <strong
                  style={{
                    color: "#1890ff",
                    fontSize: 16,
                    margin: "0 4px",
                  }}
                >
                  {" "}
                  ___{" "}
                </strong>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Ảnh của đoạn (nếu có) */}
      {resolveImg(record.passage_image_url) && (
        <div style={{ marginBottom: 16 }}>
          <img
            src={resolveImg(record.passage_image_url)}
            alt="Passage"
            style={{
              maxWidth: "100%",
              borderRadius: 4,
              border: "1px solid #eee",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {(record.passages || []).slice(1).map(p => <Card key={p.passage_id} size="small" title={p.title || `Ngữ liệu ${p.position}`} style={{marginBottom:16}}><p style={{whiteSpace:'pre-wrap'}}>{p.content}</p>{p.image_url && <img src={resolveImg(p.image_url)} alt={p.title || 'Ngữ liệu'} style={{maxWidth:'100%'}} />}</Card>)}
      {/* Hiển thị câu hỏi và lựa chọn */}
      <div style={{ marginTop: 16 }}>
        {record.questions.map((q, index) => (
          <Card key={q.id} size="small" style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>Câu {index + 1}:</strong> {q.question_text}
            </div>

            {/* Hiển thị lựa chọn nếu có */}
            {loadingChoices[q.id] ? (
              <div style={{ marginBottom: 12, color: "#999" }}>
                Đang tải lựa chọn...
              </div>
            ) : details[q.id]?.choices && details[q.id].choices.length > 0 ? (
              <div style={{ marginBottom: 12 }}>
                {details[q.id].choices.map((choice) => (
                  <div key={choice.choice_label} style={{ marginBottom: 4 }}>
                    <Tag
                      color={
                        choice.choice_label === q.correct_answer
                          ? "green"
                          : "default"
                      }
                    >
                      {choice.choice_label}
                    </Tag>
                    <span>{choice.choice_text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginBottom: 12, color: "#999" }}>
                Không có lựa chọn
              </div>
            )}

            <div>
              <Tag color="blue">Đáp án đúng: {q.correct_answer}</Tag>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PassageColumn;

