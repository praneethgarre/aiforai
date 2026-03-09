const express = require('express');
const router  = express.Router();
const { callAzureOpenAI } = require('../middleware/azureClient');

// Quiz generation
router.post('/quiz', async (req, res) => {
  try {
    const { notes, level, questionCount, format } = req.body;
    if (!notes) return res.status(400).json({ error: 'Notes required' });

    const count = Math.min(parseInt(questionCount) || 5, 10);
    const messages = [
      { role: 'system', content: 'You are LectureLens AI Quiz Generator. Respond only in valid JSON.' },
      { role: 'user', content: `Generate ${count} quiz questions from these notes.
Level: ${level || 'college'}
Format: ${format || 'mixed'}

Notes: """${typeof notes === 'object' ? JSON.stringify(notes) : notes}"""

Respond ONLY with:
{
  "title": "Quiz on [topic]",
  "level": "${level || 'college'}",
  "totalQuestions": ${count},
  "estimatedTime": "X minutes",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "question text",
      "options": ["A) option","B) option","C) option","D) option"],
      "correctAnswer": "A",
      "explanation": "why correct",
      "difficulty": "easy",
      "concept": "concept tested"
    },
    {
      "id": 2,
      "type": "conceptual",
      "question": "explain...",
      "sampleAnswer": "good answer includes...",
      "keyPoints": ["point1","point2"],
      "difficulty": "medium",
      "concept": "concept tested"
    }
  ]
}` }
    ];

    const raw  = await callAzureOpenAI(messages, 2500, true);
    const quiz = JSON.parse(raw);
    res.json({ success: true, quiz });

  } catch(err) {
    console.error('Quiz error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Summary generation
router.post('/summary', async (req, res) => {
  try {
    const { notes, summaryType } = req.body;
    if (!notes) return res.status(400).json({ error: 'Notes required' });

    const typeDesc = {
      short:      'Create a 3-5 bullet point quick revision summary',
      exam:       'Create an exam-focused summary with all testable concepts and formulas',
      conceptmap: 'Create a concept-map style breakdown showing how ideas connect'
    };

    const messages = [
      { role: 'system', content: 'You are LectureLens AI Summary Generator. Respond only in valid JSON.' },
      { role: 'user', content: `${typeDesc[summaryType] || typeDesc.short}

Notes: """${typeof notes === 'object' ? JSON.stringify(notes) : notes}"""

Respond ONLY with:
{
  "type": "${summaryType || 'short'}",
  "title": "Summary of [topic]",
  "overview": "one-line overview",
  "sections": [
    {
      "heading": "section",
      "points": ["point1","point2"],
      "mustKnow": ["critical fact"]
    }
  ],
  "keyFormulas": ["formula if applicable"],
  "examTips": ["exam tip1","exam tip2"],
  "conceptConnections": [
    { "from": "A", "to": "B", "relationship": "causes/leads to" }
  ],
  "finalNote": "one encouraging sentence"
}` }
    ];

    const raw     = await callAzureOpenAI(messages, 2000, true);
    const summary = JSON.parse(raw);
    res.json({ success: true, summary });

  } catch(err) {
    console.error('Summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
