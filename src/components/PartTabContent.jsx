import React from "react";
import { Space, Button, Upload, Table } from "antd";
import { downloadTemplate } from "../utils/readingExcelHelper";


 // Thành phần có thể sử dụng lại cho Part 5, 6, 7
const PartTabContent = ({
  part,
  importErrors = [],
  importResults = [],
  onUpload,
  onDownloadZip,
  errorColumns = [],
}) => {
  const isPart5 = part === 5;
  const isPart6 = part === 6;
  const isPart7 = part === 7;

  return (
    <div>
      <Space>
        {isPart5 ? (
          <Upload
            accept=".xlsx,.xls"
            beforeUpload={(file) => onUpload(part, file)}
            showUploadList={false}
          >
            <Button type="primary">Chọn file & Preview</Button>
          </Upload>
        ) : (
          <Upload
            accept=".zip"
            beforeUpload={(file) => onUpload(part, file)}
            showUploadList={false}
          >
            <Button type="primary">Chọn ZIP (Excel + hình)</Button>
          </Upload>
        )}

        {isPart6 && (
          <Button onClick={onDownloadZip}>Tải file ZIP Part 6</Button>
        )}

        {isPart7 && onDownloadZip && (
          <Button type="default" onClick={onDownloadZip}>
            Tải file ZIP Part 7
          </Button>
        )}

        {isPart5 && (
          <Button onClick={() => downloadTemplate(part)}>
            Tải mẫu Excel Part {part}
          </Button>
        )}
      </Space>

      {importErrors && importErrors.length > 0 && (
        <Table
          size="small"
          style={{ marginTop: 12 }}
          columns={errorColumns}
          dataSource={importErrors}
          rowKey={(r, i) => `${r.file}-${r.sheet}-${r.row}-${r.column}-${i}`}
          pagination={false}
        />
      )}

      {importResults && importResults.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: "8px",
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: "4px",
          }}
        >
          <span style={{ color: "#52c41a" }}>
             Đã import thành công {importResults.length} câu hỏi Part {part}
          </span>
        </div>
      )}
    </div>
  );
};

export default PartTabContent;

