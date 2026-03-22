const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { buildScenarioPrompt } = require('../rules_engine');
const { getSession, updateSession } = require('../store/sessionStore');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/generate-content
 * Body: { session_id, rulesOverride? }
 * Returns: { scenario }
 */
router.post('/generate-content', async (req, res) => {
  const { session_id, rulesOverride } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id gerekli' });
  }

  const session = getSession(session_id);
  if (!session) {
    return res.status(404).json({ error: 'Oturum bulunamadı' });
  }

  const systemPrompt = buildScenarioPrompt(session, session.hierarchyLevel);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Lütfen bir liderlik krizi senaryosu üret. Sadece JSON formatında yanıt ver.' }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 800
    });

    const rawContent = completion.choices[0].message.content;
    const scenario = JSON.parse(rawContent);

    // Senaryoyu oturuma kaydet
    updateSession(session_id, { scenario });

    res.json({ success: true, scenario });

  } catch (err) {
    console.error('[generate-content]', err.message);

    // API key yoksa demo senaryo döndür
    if (err.status === 401 || err.code === 'invalid_api_key') {
      const demoScenario = getDemoScenario(session);
      updateSession(session_id, { scenario: demoScenario });
      return res.json({ success: true, scenario: demoScenario, demo: true });
    }

    res.status(500).json({ error: 'Senaryo üretilemedi', detail: err.message });
  }
});

// Demo senaryo (API key yokken)
function getDemoScenario(session) {
  return {
    title: `${session.department} Departmanı — Kritik Tedarik Krizi`,
    urgency: 'critical',
    context: `Roketsan'ın yeni nesil güdüm sistemi projesinde kritik bir bileşenin tedarikçisi, bugün sabah ihracat lisansı askıya alınması nedeniyle teslimatı durdurdu.`,
    crisis: `${session.name}, üretim hattı 48 saat içinde duracak. Mevcut stok kritik seviyenin altında. Savunma Sanayi Başkanlığı proje milestone toplantısı 72 saat sonra. Yedek tedarikçi listesi güncel değil ve alternatif bileşen entegrasyonu için mühendislik onayı gerekiyor.`,
    keyQuestion: `Bu krizi yönetmek için ilk 4 saatte hangi adımları atarsınız? Kaynakları nasıl önceliklendirirsiniz?`,
    stakeholders: ['Tedarik Zinciri Müdürü', 'Üretim Müdürü', 'Proje Yöneticisi', 'DSB Temsilcisi'],
    timeConstraint: '48 saat içinde üretim hattı durma riski',
    expectedCompetencies: ['crisis_management', 'decision_making', 'strategic_thinking']
  };
}

module.exports = router;
