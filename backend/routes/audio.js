const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { evaluateTranscript, loadRules } = require('../rules_engine');
const { getSessionWithFallback, updateSession } = require('../store/sessionStore');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/submit-audio', async (req, res) => {
  const { session_id, transcript, duration } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  if (!transcript) return res.status(400).json({ error: 'transcript gerekli' });

  const session = await getSessionWithFallback(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  const rules = loadRules();

  // 1. Kural tabanlı değerlendirme
  const ruleBasedEval = evaluateTranscript(transcript);

  // 2. AI destekli derin analiz
  let aiAnalysis = null;
  let consistencyScore = null;
  let sentimentAnalysis = null;

  try {
    const competencyNames = rules.CompetencyMap.competencies
      .map(c => `${c.id}: ${c.name}`).join('\n');

    const prompt = `Sen Roketsan A.Ş. için kıdemli bir liderlik değerlendirme uzmanısın.

ADAY BİLGİLERİ:
- Ad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

SENARYO:
${JSON.stringify(session.scenario?.crisis || 'Genel liderlik senaryosu')}

ADAY YANITI (Transkript):
"${transcript}"

DEĞERLENDİR:
${competencyNames}

Lütfen aşağıdaki JSON formatında detaylı analiz yap:
{
  "sentimentAnalysis": {
    "overallTone": "pozitif/nötr/negatif",
    "tones": {
      "kararlılık": 0-100,
      "empati": 0-100,
      "özgüven": 0-100,
      "stresAltiKontrol": 0-100,
      "proaktiflik": 0-100
    },
    "dominantEmotion": "baskın duygu",
    "communicationStyle": "iletişim tarzı açıklaması"
  },
  "competencyScores": {
    "LDR_01": { "score": 0-100, "evidence": "yanıttan kanıt" },
    "LDR_02": { "score": 0-100, "evidence": "yanıttan kanıt" },
    "LDR_03": { "score": 0-100, "evidence": "yanıttan kanıt" },
    "LDR_04": { "score": 0-100, "evidence": "yanıttan kanıt" }
  },
  "strengths": ["güçlü yön 1", "güçlü yön 2", "güçlü yön 3"],
  "improvements": ["gelişim alanı 1", "gelişim alanı 2"],
  "overallScore": 0-100,
  "summary": "3-4 cümle kapsamlı değerlendirme",
  "leadershipProfile": "liderlik profili (örn: Analitik Lider, Empati Odaklı Lider vb.)"
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    aiAnalysis = JSON.parse(text);
    sentimentAnalysis = aiAnalysis.sentimentAnalysis;

    const aiOverall = aiAnalysis.overallScore || 0;
    const ruleOverall = ruleBasedEval.overallScore || 0;
    const diff = Math.abs(aiOverall - ruleOverall);
    consistencyScore = {
      aiScore: aiOverall,
      ruleScore: ruleOverall,
      difference: diff,
      consistency: diff <= 15 ? 'Yüksek' : diff <= 30 ? 'Orta' : 'Düşük',
      consistencyPercentage: Math.max(0, 100 - diff),
      interpretation: diff <= 15
        ? 'AI ve kural tabanlı sistem yüksek tutarlılıkta hemfikir'
        : diff <= 30
        ? 'Sistemler arasında orta düzeyde farklılık var, manuel inceleme önerilir'
        : 'Sistemler arasında belirgin farklılık var, değerlendirmeci incelemesi gerekli'
    };

  } catch (err) {
    console.error('[submit-audio AI]', err.message);
    consistencyScore = {
      aiScore: null,
      ruleScore: ruleBasedEval.overallScore,
      difference: null,
      consistency: 'Hesaplanamadı',
      consistencyPercentage: null,
      interpretation: 'AI analizi tamamlanamadı, yalnızca kural tabanlı değerlendirme kullanıldı'
    };
  }

  const finalEvaluation = {
    ...ruleBasedEval,
    duration: duration || 0,
    transcript,
    aiAnalysis,
    sentimentAnalysis,
    consistencyScore,
    timestamp: new Date().toISOString()
  };

  updateSession(session_id, { audioResult: finalEvaluation });
  res.json({ success: true, evaluation: finalEvaluation });
});

module.exports = router;