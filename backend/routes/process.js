const express = require('express');
const router  = express.Router();
const { callAzureOpenAI } = require('../middleware/azureClient');

router.post('/notes', async (req, res) => {
  try {
    const { transcript, subject, level } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    const messages = [
      { role: 'system', content: 'You are LectureLens AI Concept Engine. Respond only in valid JSON.' },
      { role: 'user', content: `Analyze this lecture transcript and produce structured notes.
Subject: ${subject || 'Auto-detect'}
Level: ${level || 'college'}

Transcript:
"""${transcript}"""

Respond ONLY with this JSON:
{
  "title": "lecture topic",
  "subject": "detected subject",
  "sections": [
    {
      "heading": "section title",
      "content": "clear explanation",
      "keyPoints": ["point1","point2"],
      "examples": ["example if relevant"]
    }
  ],
  "keyConcepts": [
    { "term": "term", "definition": "definition", "importance": "why it matters" }
  ],
  "topicHierarchy": { "mainTopic": "main", "subTopics": ["sub1","sub2"] },
  "quickRecap": "2-3 sentence overview",
  "studyTips": ["tip1","tip2"]
}` }
    ];

    const raw   = await callAzureOpenAI(messages, 2500, true);
    const notes = JSON.parse(raw);
    res.json({ success: true, notes });

  } catch(err) {
    console.error('Process notes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
