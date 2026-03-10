const express = require('express');
const router  = express.Router();
const { callAzureOpenAI } = require('../middleware/azureClient');

// ─────────────────────────────────────────────────────────────
//  POST /api/learn/quiz
// ─────────────────────────────────────────────────────────────
router.post('/quiz', async (req, res) => {
  try {
    const { notes, level, questionCount, format } = req.body;
    if (!notes) return res.status(400).json({ error: 'Notes required' });

    const count = Math.min(parseInt(questionCount) || 5, 10);
    console.log(`🧪 Generating ${count} quiz questions. Level: ${level}, Format: ${format}`);

    const messages = [
      {
        role: 'system',
        content: 'You are LectureLens AI Quiz Generator. You MUST respond ONLY with valid JSON — no markdown, no explanation, just the raw JSON object.'
      },
      {
        role: 'user',
        content: `Generate exactly ${count} quiz questions from these notes.
Level: ${level || 'college'}
Format: ${format || 'mixed'}

Notes:
"""${typeof notes === 'object' ? JSON.stringify(notes) : notes}"""

IMPORTANT: For MCQ questions, correctAnswer must be exactly "A", "B", "C", or "D" (the letter only, no other text).
For options, format them as "A) option text", "B) option text" etc.

Respond ONLY with this JSON (no markdown, no extra text):
{
  "title": "Quiz on [topic name]",
  "level": "${level || 'college'}",
  "totalQuestions": ${count},
  "estimatedTime": "${count * 2} minutes",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "question text here",
      "options": ["A) first option", "B) second option", "C) third option", "D) fourth option"],
      "correctAnswer": "A",
      "explanation": "explanation of why A is correct",
      "difficulty": "easy",
      "concept": "concept being tested"
    },
    {
      "id": 2,
      "type": "conceptual",
      "question": "Explain ...",
      "sampleAnswer": "A good answer should include ...",
      "keyPoints": ["key point 1", "key point 2"],
      "difficulty": "medium",
      "concept": "concept being tested"
    }
  ]
}`
      }
    ];

    const raw = await callAzureOpenAI(messages, 3000, true);

    let quiz;
    try {
      quiz = JSON.parse(raw);
    } catch(parseErr) {
      console.error('Quiz JSON parse error. Raw:', raw.substring(0, 500));
      return res.status(500).json({ error: 'AI returned invalid JSON for quiz. Try again.' });
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res.status(500).json({ error: 'AI did not return valid quiz questions. Try again.' });
    }

    console.log(`✅ Quiz generated: ${quiz.questions.length} questions`);
    res.json({ success: true, quiz });

  } catch(err) {
    console.error('❌ Quiz error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/learn/summary
// ─────────────────────────────────────────────────────────────
router.post('/summary', async (req, res) => {
  try {
    const { notes, summaryType } = req.body;
    if (!notes) return res.status(400).json({ error: 'Notes required' });

    console.log(`📋 Generating summary. Type: ${summaryType}`);

    const typeDesc = {
      short:      'Create a 3-5 bullet point quick revision summary focused on the most important points',
      exam:       'Create an exam-focused summary with all testable concepts, definitions, and formulas a student needs to memorize',
      conceptmap: 'Create a concept-map style breakdown showing how all ideas connect and relate to each other'
    };

    const messages = [
      {
        role: 'system',
        content: 'You are LectureLens AI Summary Generator. You MUST respond ONLY with valid JSON — no markdown, no explanation, just the raw JSON object.'
      },
      {
        role: 'user',
        content: `${typeDesc[summaryType] || typeDesc.short}

Notes:
"""${typeof notes === 'object' ? JSON.stringify(notes) : notes}"""

Respond ONLY with this JSON (no markdown, no extra text):
{
  "type": "${summaryType || 'short'}",
  "title": "Summary of [topic]",
  "overview": "one sentence overview of the topic",
  "sections": [
    {
      "heading": "section heading",
      "points": ["key point 1", "key point 2", "key point 3"],
      "mustKnow": ["critical fact 1"]
    }
  ],
  "keyFormulas": ["formula 1 if applicable"],
  "examTips": ["exam tip 1", "exam tip 2"],
  "conceptConnections": [
    { "from": "Concept A", "to": "Concept B", "relationship": "leads to / causes / enables" }
  ],
  "finalNote": "one short encouraging sentence for the student"
}`
      }
    ];

    const raw = await callAzureOpenAI(messages, 2500, true);

    let summary;
    try {
      summary = JSON.parse(raw);
    } catch(parseErr) {
      console.error('Summary JSON parse error. Raw:', raw.substring(0, 500));
      return res.status(500).json({ error: 'AI returned invalid JSON for summary. Try again.' });
    }

    if (!summary.sections) {
      return res.status(500).json({ error: 'AI did not return valid summary. Try again.' });
    }

    console.log(`✅ Summary generated: ${summary.sections.length} sections`);
    res.json({ success: true, summary });

  } catch(err) {
    console.error('❌ Summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
