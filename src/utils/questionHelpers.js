/**
 * Hàm trợ giúp cho việc quản lý câu hỏi
 */

// Nhóm câu hỏi theo đoạn văn (cho Part 6 & 7)
export const groupQuestionsByPassage = (items) => {
  const groups = new Map();

  items.forEach((q) => {
    const keyFromId = q.passage_id ? `pid:${q.passage_id}` : null;
    const keyFromTitle = `${(q.passage_title || "").trim()}_${(
      q.passage_content || ""
    ).trim()}_${(q.passage_image_url || "").trim()}`;
    const groupKey = keyFromId || keyFromTitle;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        test_name: q.test_name,
        test_id: q.test_id || null,
        passage_title: q.passage_title,
        passage_content: q.passage_content,
        passage_image_url: q.passage_image_url,
        passage_id: q.passage_id, passages: q.passages || [], group_id: q.group_id,
        questions: [],
        part_number: q.part_number,
      });
    }

    groups.get(groupKey).questions.push(q);
  });

  const sorted = Array.from(groups.values()).map((g) => ({
    ...g,
    questions: g.questions.sort((a, b) => (a.id || 0) - (b.id || 0)),
  }));

  sorted.sort((a, b) => {
    const aId = a.questions[0]?.id || 0;
    const bId = b.questions[0]?.id || 0;
    return aId - bId;
  });

  return sorted;
};

/*
 * Chuẩn hóa dữ liệu câu hỏi từ API sang định dạng UI
 * @param {Object} row - Raw question data from API
 * @returns {Object} Dữ liệu câu hỏi đã chuẩn hóa
 */
export const toUI = (row) => {
  // Xử lý các tên trường có thể khác nhau cho câu hỏi nhập vào
  const questionId = row.question_id || row.id;
  const questionText = row.question_text || row.text || row.content;
  const partNumber = row.part_number || row.part || row.partNumber;
  const testName = row.test_name || row.testName || row.test || "";
  const testId = row.test_id || row.testId || null;
  const difficultyLevel =
    row.difficulty_level || row.difficulty || row.level || 2;
  const correctAnswer = row.correct_answer || row.answer || row.correctAnswer;
  const passageTitle = row.passage_title || row.passageTitle || "";
  const passageContent = row.passage_content || row.passageContent || "";
  const passageImageUrl =
    row.passage_image_url || row.passageImageUrl || row.image_url || "";
  const imageUrl = row.image_url || row.question_image_url || "";
  const passageId = row.passage_id || null;
  const createdAt =
    row.created_at || row.createdAt || row.created || new Date().toISOString();

  return {
    id: questionId,
    question_text: questionText,
    part_number: partNumber,
    difficulty: difficultyLevel,
    test_name: testName,
    test_id: testId,
    correct_answer: correctAnswer,
    passage_title: passageTitle,
    passage_content: passageContent,
    passage_image_url: passageImageUrl,
    image_url: imageUrl,
    passage_id: passageId, passages: row.passages || [], group_id: row.group_id,
    created_at: createdAt,
  };
};

