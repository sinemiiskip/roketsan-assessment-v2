const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildScenarioPrompt } = require('../rules_engine');
const { getSession, updateSession } = require('../store/sessionStore');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate-content', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });
  const systemPrompt = buildScenarioPrompt(session, session.hierarchyLevel);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(systemPrompt + '\n\nSadece JSON formatında yanıt ver.');
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const scenario = JSON.parse(text);
    updateSession(session_id, { scenario });
    res.json({ success: true, scenario });
  } catch (err) {
    const demo = {
      title: `${session.department} — Tedarik Krizi`,
      urgency: 'critical',
      context: 'Kritik bileşen tedarikçisi teslimatı durdurdu.',
      crisis: `${session.name}, üretim hattı 48 saat içinde duracak.`,
      keyQuestion: 'İlk 4 saatte hangi adımları atarsınız?',
      stakeholders: ['Tedarik Müdürü', 'Üretim Müdürü'],
      timeConstraint: '48 saat',
      expectedCompetencies: ['crisis_management', 'decision_making']
    };
    updateSession(session_id, { scenario: demo });
    res.json({ success: true, scenario: demo, demo: true });
  }
});

module.exports = router;