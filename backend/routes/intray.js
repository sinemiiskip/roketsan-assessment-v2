const express = require('express');
const router = express.Router();
const { scoreInTray } = require('../rules_engine');
const { getSession, updateSession, saveResults } = require('../store/sessionStore');

router.post('/submit-intray', async (req, res) => {
  const { session_id, selections } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  if (!selections || typeof selections !== 'object') return res.status(400).json({ error: 'selections objesi gerekli' });

  const session = getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  const result = scoreInTray(selections);
  updateSession(session_id, { intrayResult: result });

  // Tüm sonuçları Supabase'e kaydet
  const updatedSession = getSession(session_id);
  const { overallScore, grade } = await saveResults(session_id, updatedSession);

  res.json({ success: true, result, overallScore, grade });
});

router.get('/session/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });
  res.json({
    success: true,
    session: {
      session_id: session.session_id,
      name: session.name,
      department: session.department,
      position: session.position,
      hierarchyLevel: session.hierarchyLevel,
      hasScenario: !!session.scenario,
      hasAudioResult: !!session.audioResult,
      hasIntrayResult: !!session.intrayResult,
      createdAt: session.createdAt
    }
  });
});

module.exports = router;