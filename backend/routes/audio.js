const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { evaluateTranscript, loadRules } = require('../rules_engine');
const { getSession, updateSession } = require('../store/sessionStore');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/submit-audio', async (req, res) => {
  const { session_id, transcript, duration } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  if (!transcript) return res.status(400).json({ error: 'transcript gerekli' });
  const session = getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  try {
    const baseEvaluation = evaluateTranscript(transcript);
    let aiAnalysis = null;

    if (process.env.GEMINI_API_KEY) {
      const rules = loadRules();
      const competencyNames = rules.CompetencyMap.competencies.map(c => c.name).join(', ');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Sen bir liderlik değerlendirme uzmanısın. Şu yetkinlikleri değerlendir: ${competencyNames}.
Senaryo: ${JSON.stringify(session.scenario?.crisis || 'Genel liderlik senaryosu')}
Katılımcı yanıtı: "${transcript}"
Sadece JSON formatında yanıt ver:
{
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "improvements": ["gelişim alanı 1", "gelişim alanı 2"],
  "overallScore": 75,
  "summary": "kısa değerlendirme metni"
}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '').trim();
      aiAnalysis = JSON.parse(text);
    }

    const finalEvaluation = { ...baseEvaluation, duration: duration || 0, aiAnalysis, timestamp: new Date().toISOString() };
    updateSession(session_id, { audioResult: finalEvaluation });
    res.json({ success: true, evaluation: finalEvaluation });

  } catch (err) {
    console.error('[submit-audio]', err.message);
    const fallback = { ...evaluateTranscript(transcript), duration: duration || 0, aiAnalysis: null, timestamp: new Date().toISOString() };
    updateSession(session_id, { audioResult: fallback });
    res.json({ success: true, evaluation: fallback });
  }
});

module.exports = router;