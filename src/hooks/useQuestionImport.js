import { useState } from "react";
import { message } from "antd";
import * as XLSX from "xlsx";
import { questionsService } from "../services";
import { parsePart5Excel, convertPart5ToItems } from "../utils/readingExcelHelper";

/**
 * Custom hook để xử lý logic import câu hỏi
 */
export const useQuestionImport = (onImportSuccess) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewAllRows, setPreviewAllRows] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [previewPart, setPreviewPart] = useState(5);
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const openPreview = async (part, file) => {
    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      let rows = [];
      let errors = [];
      
      if (part === 5) {
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const result = parsePart5Excel(sheet);
        rows = result.rows;
        errors = result.errors;
        setPreviewAllRows(result.rows);
      }

      setPreviewRows(rows.slice(0, 10));
      setPreviewErrors(errors);
      setPreviewPart(part);
      setPendingFile(file);
      setPreviewVisible(true);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const doImport = async () => {
    if (!pendingFile) return;
    
    try {
      setLoading(true);

      if (previewErrors.length) { message.error("Sửa tất cả lỗi trong file trước khi nhập."); return; }
      // Đọc file Excel và chuyển đổi thành mảng items
      const data = await pendingFile.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      let items = [];
      
      if (previewPart === 5) {
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const validPreviewRows = (previewAllRows || []).map(
          (row) => row.question_text
        );
        items = convertPart5ToItems(raw, validPreviewRows).map((item, index) => ({ ...item, _source: { file: pendingFile.name, sheet: wb.SheetNames[0], row: raw[index].__rowNum__ + 1 } }));
      }

      if (items.length === 0) {
        message.error("Không tìm thấy dữ liệu hợp lệ trong file");
        return;
      }

      // Lưu ý: questionsService.importBulk đã đóng gói items trong { items: ... }
      const res = await questionsService.importBulk(items);

      if (res.duplicate) { message.info("Dữ liệu này đã được nhập."); setPreviewVisible(false); return; }
      const createdItems = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      const created = Number(res?.created ?? createdItems.length);
      const errs = Array.isArray(res?.errors) ? res.errors : [];

      message.success(
        `Import Part ${previewPart} thành công: ${created}/${items.length} câu`
      );

      setPreviewVisible(false);
      setPendingFile(null);

      // Gọi callback thành công
      if (onImportSuccess) {
        onImportSuccess(previewPart, createdItems, errs);
      }
    } catch (e) {
      setPreviewErrors(e.response?.data?.errors || []);
      message.error(e.response?.data?.error || "Import thất bại");
    } finally {
      setLoading(false);
    }
  };

  return {
    previewVisible,
    previewRows,
    previewErrors,
    previewPart,
    pendingFile,
    loading,
    openPreview,
    doImport,
    setPreviewVisible,
    setPendingFile,
  };
};



