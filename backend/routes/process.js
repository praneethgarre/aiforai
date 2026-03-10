const express = require('express');
const router  = express.Router();
const { callAzureOpenAI } = require('../middleware/azureClient');

router.post('/notes', async (req, res) => {
  try {
    const { transcript, subject, level } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    console.log(`🧠 Processing notes. Level: ${level}, Subject: ${subject}`);

    const messages = [
      {
        role: 'system',
        content: 'You are LectureLens AI Concept Engine. You MUST respond ONLY with valid JSON — no markdown, no explanation, no preamble, just the raw JSON object.'
      },
      {
        role: 'user',
        content: `Analyze this lecture transcript and produce structured study notes.

Subject: ${subject || 'Auto-detect'}
Level: ${level || 'college'}

Transcript:
"""${transcript}"""

Respond ONLY with this exact JSON structure (no markdown, no extra text):
{
  "title": "lecture topic",
  "subject": "detected subject",
  "sections": [
    {
      "heading": "section title",
      "content": "clear explanation in 2-3 sentences",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "examples": ["example if relevant"]
    }
  ],
  "keyConcepts": [
    {
      "term": "term name",
      "definition": "clear definition",
      "importance": "why it matters"
    }
  ],
  "topicHierarchy": {
    "mainTopic": "main topic name",
    "subTopics": ["subtopic 1", "subtopic 2"]
  },
  "quickRecap": "2-3 sentence overview of the entire lecture",
  "studyTips": ["tip 1", "tip 2", "tip 3"]
}`
      }
    ];

    const raw = await callAzureOpenAI(messages, 3000, true);

    let notes;
    try {
      notes = JSON.parse(raw);
    } catch(parseErr) {
      console.error('JSON parse error. Raw response:', raw.substring(0, 500));
      return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
    }

    // Validate minimum structure
    if (!notes.title || !notes.sections) {
      return res.status(500).json({ error: 'AI response missing required fields. Try again.' });
    }

    console.log(`✅ Notes generated: ${notes.sections.length} sections, ${(notes.keyConcepts||[]).length} concepts`);
    res.json({ success: true, notes });

  } catch(err) {
    console.error('❌ Process notes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
