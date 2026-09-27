import * as XLSX from "xlsx";

/**
 * Tải file Excel mẫu
 */
export function downloadTemplate(part) {
  // Chỉ Part 5 có file Excel mẫu, Part 6 & 7 dùng file ZIP
  if (part !== 5) {
    console.warn(
      `Part ${part} does not have Excel template, use ZIP file instead`
    );
    return;
  }
  // Tải file Excel mẫu từ public/templates
  const a = document.createElement("a");
  a.href = `/templates/toeic_part${part}_template.xlsx?v=20260926-3`;
  a.download = `toeic_part${part}_template.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}


 // Kiểm tra và phân tích file Excel Part 5
export function parsePart5Excel(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const rows = [];
  const errors = [];
  const seen = new Map();

  raw.forEach((r, idx) => {
    const A = r.A || r["A"] || r["a"];
    const B = r.B || r["B"] || r["b"];
    const C = r.C || r["C"] || r["c"];
    const D = r.D || r["D"] || r["d"];
    const qa = String(r.correct_answer || r["correct_answer"] || "")
      .trim()
      .toUpperCase();
    const qt = String(r.question_text || r["question_text"] || "").trim();
    const explanation = String(r.explanation || r["explanation"] || "").trim();

    if (!qt) errors.push({ row: idx + 2, reason: "Thiếu nội dung câu hỏi" });
    if (!(A && B && C && D))
      errors.push({ row: idx + 2, reason: "Thiếu đáp án A/B/C/D" });
    if (!["A", "B", "C", "D"].includes(qa))
      errors.push({
        row: idx + 2,
        reason: "Đáp án đúng phải là A/B/C/D",
      });


    const key = qt.toLowerCase();
    if (key) {
      if (seen.has(key))
        errors.push({
          row: idx + 2,
          reason: `Trùng câu hỏi với dòng ${seen.get(key)}`,
        });
      else seen.set(key, idx + 2);
    }

    // Chỉ thêm vào preview nếu không có lỗi cho dòng này
    if (!errors.some((e) => e.row === idx + 2)) {
      rows.push({
        question_text: qt,
        part_number: 5,
        explanation: explanation || null,
      });
    }
  });

  return { rows, errors, raw };
}


 // Chuyển đổi dữ liệu Excel Part 5 thành items để import
export function convertPart5ToItems(raw, validPreviewRows) {
  return raw
    .map((r) => {
      const qt = String(r.question_text || r["question_text"] || "").trim();
      const qa = String(r.correct_answer || r["correct_answer"] || "")
        .trim()
        .toUpperCase();

      // Chỉ bao gồm nếu câu hỏi nằm trong preview (hợp lệ)
      if (!validPreviewRows.includes(qt)) {
        return null;
      }

      return {
        part_number: 5,
        question_type: "reading",
        question_text: qt,
        correct_answer: qa,
        explanation:
          String(r.explanation || r["explanation"] || "").trim() || null,
        choices: [
          { label: "A", text: String(r.A || r["A"] || "").trim() },
          { label: "B", text: String(r.B || r["B"] || "").trim() },
          { label: "C", text: String(r.C || r["C"] || "").trim() },
          { label: "D", text: String(r.D || r["D"] || "").trim() },
        ],
      };
    })
    .filter((item) => item !== null);
}
