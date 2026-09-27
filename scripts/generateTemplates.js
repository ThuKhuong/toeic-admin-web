import XLSX from "xlsx";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, "../public/templates");

// Ensure templates directory exists
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Helper: Create 1x1 PNG buffer
const createMiniPNG = () => {
  return Buffer.from(
    "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000a49444154789c6360000002000154a24f5c0000000049454e44ae426082",
    "hex"
  );
};

// Create Part 5 Excel template
function createPart5Template() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    {
      part_number: 5,
      question_text: "He ___ to work by bus.",
      A: "goes",
      B: "go",
      C: "going",
      D: "went",
      correct_answer: "A",
      explanation:
        "Câu này cần động từ ở thì hiện tại đơn (present simple) vì câu có 'by bus' chỉ thói quen. Chủ ngữ 'He' là ngôi thứ 3 số ít nên động từ phải thêm 's/es'. 'goes' là đúng.",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, "questions");
  return wb;
}

// Create Part 6 Excel template
function createPart6Template() {
  const wb = XLSX.utils.book_new();
  const passages = [
    {
      key: "p1",
      title: "Product update memo",
      content:
        "We will roll out the new feature pack next week. Review the screenshot and confirm translation edits.",
      image_url: "images/passage1.png",
    },
  ];
  const questions = [
    {
      passage_key: "p1",
      question_text: "When will the feature pack be released?",
      A: "Tomorrow",
      B: "Next week",
      C: "Next month",
      D: "Next quarter",
      correct_answer: "B",
    },
    {
      passage_key: "p1",
      question_text: "What should be reviewed?",
      A: "Pricing table",
      B: "Support schedule",
      C: "Attached screenshot",
      D: "Server logs",
      correct_answer: "C",
    },
    {
      passage_key: "p1",
      question_text: "What is being updated?",
      A: "User guide",
      B: "Feature pack",
      C: "Office policy",
      D: "Holiday plan",
      correct_answer: "B",
    },
    {
      passage_key: "p1",
      question_text: "What is requested from the team?",
      A: "Cancel deployment",
      B: "Book a meeting room",
      C: "Confirm translation edits",
      D: "Update salaries",
      correct_answer: "C",
    },
  ];
  const wsP = XLSX.utils.json_to_sheet(passages);
  const wsQ = XLSX.utils.json_to_sheet(questions);
  XLSX.utils.book_append_sheet(wb, wsP, "passages");
  XLSX.utils.book_append_sheet(wb, wsQ, "questions");
  return wb;
}

// Create Part 7 Excel template
function createPart7Template() {
  const wb = XLSX.utils.book_new();
  const passages = [
    {
      key: "p1",
      title: "Office notice",
      content:
        "We are relocating next month. Check the new address and updated parking map.",
      image_url: "images/passage1.png",
    },
  ];
  const questions = [
    {
      passage_key: "p1",
      question_text: "What is being announced?",
      A: "A relocation",
      B: "A hiring plan",
      C: "A renovation",
      D: "A merger",
      correct_answer: "A",
    },
    {
      passage_key: "p1",
      question_text: "What should employees review before commuting?",
      A: "Lunch schedule",
      B: "New address and parking map",
      C: "Benefits handbook",
      D: "Training calendar",
      correct_answer: "B",
    },
  ];
  const wsP = XLSX.utils.json_to_sheet(passages);
  const wsQ = XLSX.utils.json_to_sheet(questions);
  XLSX.utils.book_append_sheet(wb, wsP, "passages");
  XLSX.utils.book_append_sheet(wb, wsQ, "questions");
  return wb;
}

// Create Part 6 ZIP
function createPart6Zip() {
  const zip = new AdmZip();
  const wb = createPart6Template();
  const xlsxBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  zip.addFile("passages_questions.xlsx", xlsxBuf);
  zip.addFile("images/passage1.png", createMiniPNG());
  return zip.toBuffer();
}

// Create Part 7 ZIP with proper structure (Excel + multiple PNG images)
function createPart7Zip() {
  const zip = new AdmZip();
  const wb = createPart7Template();
  const xlsxBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  zip.addFile("passages_questions.xlsx", xlsxBuf);

  // Add multiple PNG images (P1, P2, P3, P4) - using placeholder for now
  // In production, these should be actual images
  const pngBuf = createMiniPNG();
  zip.addFile("images/P1.png", pngBuf);
  zip.addFile("images/P2.png", pngBuf);
  zip.addFile("images/P3.png", pngBuf);
  zip.addFile("images/P4.png", pngBuf);

  return zip.toBuffer();
}

// Create Listening ZIP for a specific part
function createListeningZip(part) {
  const zip = new AdmZip();
  const wb = XLSX.utils.book_new();
  let sampleData = [];

  // Part 1: Mỗi câu hỏi có hình ảnh và audio riêng
  if (part === 1) {
    const pngBuf = createMiniPNG();
    const mp3Header = Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    // Chỉ tạo 1 dòng dữ liệu mẫu
    const imagePath = `part1/images/Q1.png`;
    const audioPath = `part1/audio/Q1.mp3`;

    zip.addFile(imagePath, pngBuf);
    zip.addFile(audioPath, mp3Header);

    sampleData.push({
      part_number: 1,
      question_text: `Look at the picture. What is the person doing?`,
      choiceA: "Option A",
      choiceB: "Option B",
      choiceC: "Option C",
      choiceD: "Option D",
      correct_answer: "A",
      image_path: imagePath,
      audio_path: audioPath,
    });
  }
  // Part 2: Chỉ có audio, nhưng thêm folder images với file placeholder để cấu trúc nhất quán
  else if (part === 2) {
    const mp3Header = Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    zip.addFile(`part2/audio/part2.mp3`, mp3Header);

    // Thêm folder images với file placeholder (Part 2 không cần image nhưng để cấu trúc nhất quán)
    const pngBuf = createMiniPNG();
    zip.addFile(
      `part2/images/.placeholder`,
      Buffer.from("Part 2 does not require images")
    );

    sampleData = [
      {
        part_number: 2,
        material_title: "Part 2 Sample Conversation",
        audio_path: `part2/audio/part2.mp3`,
        question_text: `Sample question for Part 2`,
        choiceA: "Option A",
        choiceB: "Option B",
        choiceC: "Option C",
        correct_answer: "A",
      },
    ];
  }
  // Part 3: Có audio và nhiều hình ảnh (mỗi nhóm conversation có 1 hình)
  else if (part === 3) {
    const mp3Header = Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    zip.addFile(`part3/audio/part3.mp3`, mp3Header);

    const pngBuf = createMiniPNG();
    const imageGroups = [
      { name: "62-64", title: "Conversation 62-64" },
      { name: "65-67", title: "Conversation 65-67" },
      { name: "68-70", title: "Conversation 68-70" },
    ];

    imageGroups.forEach((group) => {
      zip.addFile(`part3/images/${group.name}.png`, pngBuf);
      // Mỗi nhóm có 3 câu hỏi
      for (let q = 1; q <= 3; q++) {
        sampleData.push({
          part_number: 3,
          material_title: group.title,
          audio_path: `part3/audio/part3.mp3`,
          question_text: `Question ${q} for ${group.title}`,
          choiceA: "Option A",
          choiceB: "Option B",
          choiceC: "Option C",
          choiceD: "Option D",
          correct_answer: "A",
          image_path: `part3/images/${group.name}.png`,
        });
      }
    });
  }
  // Part 4: Tương tự Part 3
  else if (part === 4) {
    const mp3Header = Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    zip.addFile(`part4/audio/part4.mp3`, mp3Header);

    const pngBuf = createMiniPNG();
    const imageGroups = [
      { name: "71-73", title: "Talk 71-73" },
      { name: "74-76", title: "Talk 74-76" },
      { name: "77-79", title: "Talk 77-79" },
    ];

    imageGroups.forEach((group) => {
      zip.addFile(`part4/images/${group.name}.png`, pngBuf);
      // Mỗi nhóm có 3 câu hỏi
      for (let q = 1; q <= 3; q++) {
        sampleData.push({
          part_number: 4,
          material_title: group.title,
          audio_path: `part4/audio/part4.mp3`,
          question_text: `Question ${q} for ${group.title}`,
          choiceA: "Option A",
          choiceB: "Option B",
          choiceC: "Option C",
          choiceD: "Option D",
          correct_answer: "A",
          image_path: `part4/images/${group.name}.png`,
        });
      }
    });
  }

  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, "questions");
  const xlsxBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Thêm Excel vào folder part{part}/
  zip.addFile(`part${part}/questions.xlsx`, xlsxBuf);

  return zip.toBuffer();
}

// Generate all files
console.log("Generating template files...");

// Excel templates (only Part 5, Part 6 & 7 use ZIP)
console.log("Creating Excel templates...");
XLSX.writeFile(
  createPart5Template(),
  path.join(templatesDir, "toeic_part5_template.xlsx")
);
console.log("✓ Created toeic_part5_template.xlsx");
console.log("⚠ Part 6 & 7 use ZIP files, skipping Excel templates");

// ZIP files
console.log("\nCreating ZIP files...");

if (!fs.existsSync(path.join(templatesDir, "toeic_part6_sample.zip"))) {
  fs.writeFileSync(
    path.join(templatesDir, "toeic_part6_sample.zip"),
    createPart6Zip()
  );
  console.log(" Created toeic_part6_sample.zip");
} else {
  console.log("toeic_part6_sample.zip already exists, skipping...");
}

if (!fs.existsSync(path.join(templatesDir, "toeic_part7_sample.zip"))) {
  fs.writeFileSync(
    path.join(templatesDir, "toeic_part7_sample.zip"),
    createPart7Zip()
  );
  console.log(" Created toeic_part7_sample.zip");
} else {
  console.log(" toeic_part7_sample.zip already exists, skipping...");
}

// Listening ZIP files
for (let part = 1; part <= 4; part++) {
  const filename = `toeic_listening_part${part}_sample.zip`;
  const filepath = path.join(templatesDir, filename);

  // Luôn tạo lại file để đảm bảo có cấu trúc mới nhất
  fs.writeFileSync(filepath, createListeningZip(part));
  console.log(`✓ Created/Updated ${filename}`);
}

console.log("\n All template files generated successfully!");
