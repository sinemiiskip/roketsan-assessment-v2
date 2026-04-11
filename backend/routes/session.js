const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { resolveHierarchyLevel } = require('../rules_engine');
const { createSession, setSession, saveCandidate } = require('../store/sessionStore');

router.post('/init-session', async (req, res) => {
  const { name, department, position } = req.body;
  if (!name || !department || !position) {
    return res.status(400).json({ error: 'Eksik alan', required: ['name', 'department', 'position'] });
  }
  const session_id = uuidv4();
  const hierarchyLevel = resolveHierarchyLevel(position);
  const sessionData = createSession({
    session_id, name: name.trim(), department: department.trim(),
    position: position.trim(), hierarchyLevel,
    scenario: null, audioResult: null, intrayResult: null,
    iceBreakerResult: null, scenarioResult: null
  });
  setSession(session_id, sessionData);

  // Supabase'e kaydet
  await saveCandidate(sessionData);

  const token = jwt.sign(
    { session_id, name, department },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '2h' }
  );
  res.json({ success: true, session_id, token, hierarchyLevel, message: `Hoş geldiniz, ${name}!` });
});

module.exports = router;