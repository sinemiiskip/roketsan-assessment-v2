const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildScenarioPrompt, loadRules, resolveDepartment } = require('../rules_engine');
const { getSession, updateSession } = require('../store/sessionStore');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate-content', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadi' });
  const systemPrompt = buildScenarioPrompt(session, session.hierarchyLevel);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(systemPrompt + '\n\nSadece JSON formatinda yanit ver.');
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const scenario = JSON.parse(text);
    updateSession(session_id, { scenario });
    res.json({ success: true, scenario });
  } catch (err) {
    const demo = getDemoScenario(session);
    updateSession(session_id, { scenario: demo });
    res.json({ success: true, scenario: demo, demo: true });
  }
});

router.post('/generate-icebreaker', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadi' });
  const rules = loadRules();
  const dept = resolveDepartment(session.department);
  const competencies = rules.CompetencyMap.competencies.map(function(c) { return c.name; }).join(', ');
  const themes = dept && dept.themes ? dept.themes.join(', ') : 'genel';
  
  const prompt = 'Sen Roketsan icin liderlik degerlendirme uzmanissin.\n' +
    session.name + ' (' + session.department + ' - ' + session.position + ') icin 4 buz kirici soru uret.\n' +
    'Departman temaları: ' + themes + '\n' +
    'Yetkinlikler: ' + competencies + '\n' +
    'KURALLAR: Gercekci is senaryosu, 4 secenek, Turkce, sadece JSON.\n' +
    'FORMAT: {"questions":[{"id":1,"question":"...","options":[{"id":"a","text":"...","competency":"LDR_01","score":3},{"id":"b","text":"...","competency":"LDR_02","score":2},{"id":"c","text":"...","competency":"LDR_03","score":1},{"id":"d","text":"...","competency":"LDR_04","score":0}]}]}\n' +
    'LDR_01=Stratejik, LDR_02=Inisiyatif, LDR_03=Ekip, LDR_04=Etik';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(text);
    updateSession(session_id, { iceBreakerQuestions: data.questions });
    res.json({ success: true, questions: data.questions });
  } catch (err) {
    console.error('[generate-icebreaker]', err.message);
    res.json({ success: true, questions: getFallbackQuestions(session), demo: true });
  }
});

router.post('/generate-intray', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadi' });
  const dept = resolveDepartment(session.department);
  const themes = dept && dept.themes ? dept.themes.join(', ') : 'genel';

  const prompt = 'Sen Roketsan IK uzmanissin.\n' +
    session.name + ' (' + session.department + ' - ' + session.position + ') icin 8 gercekci e-posta uret.\n' +
    'Departman temalari: ' + themes + '\n' +
    'DAGILIM: 2xQ1(20pt), 2xQ2(15pt), 2xQ3(10pt), 2xQ4(5pt)\n' +
    'KURALLAR: Departmana ozgu, gercekci gonderenler, 2-3 cumle icerik, Turkce, sadece JSON.\n' +
    'FORMAT: {"emails":[{"id":"email_1","from":"Ad Soyad - Unvan","subject":"...","body":"...","time":"08:47","correctQuadrant":"Q1","points":20,"explanation":"..."}]}';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(text);
    updateSession(session_id, { intrayEmails: data.emails });
    res.json({ success: true, emails: data.emails });
  } catch (err) {
    console.error('[generate-intray]', err.message);
    res.json({ success: true, emails: getFallbackEmails(session), demo: true });
  }
});

function getDemoScenario(session) {
  return {
    title: session.department + ' Departmani Kritik Tedarik Krizi',
    urgency: 'critical',
    context: 'Roketsan gudum sistemi projesinde tedarikci teslimatı durdurdu.',
    crisis: session.name + ', uretim hatti 48 saat icinde duracak. DSB toplantisi 72 saat sonra.',
    keyQuestion: 'Ilk 4 saatte hangi adimları atarsınız?',
    stakeholders: ['Tedarik Muduru', 'Uretim Muduru', 'Proje Yoneticisi'],
    timeConstraint: '48 saat',
    expectedCompetencies: ['LDR_01', 'LDR_02']
  };
}

function getFallbackQuestions(session) {
  return [
    {
      id: 1,
      question: session.department + ' departmaninda kritik proje gecikmesi oldu. Ilk tepkiniz?',
      options: [
        { id: 'a', text: 'Ekibi toplayip durum degerlendirmesi yaparim.', competency: 'LDR_01', score: 3 },
        { id: 'b', text: 'Sorumluyu belirleyip hesap sorarim.', competency: 'LDR_02', score: 1 },
        { id: 'c', text: 'Ust yonetime bildiririm.', competency: 'LDR_03', score: 2 },
        { id: 'd', text: 'Kok nedeni analiz ederim.', competency: 'LDR_01', score: 3 }
      ]
    },
    {
      id: 2,
      question: 'Iki kritik proje ayni anda son asamaya geldi. Ne yaparsınız?',
      options: [
        { id: 'a', text: 'Oneme gore onceliklendiririm.', competency: 'LDR_01', score: 3 },
        { id: 'b', text: 'Esit kaynak ayiririm.', competency: 'LDR_02', score: 1 },
        { id: 'c', text: 'Ekiple karar veririm.', competency: 'LDR_03', score: 2 },
        { id: 'd', text: 'Mudurden yonlendirme isterim.', competency: 'LDR_04', score: 1 }
      ]
    },
    {
      id: 3,
      question: 'Ekibiniz yuksek riskli ama yenilikci bir fikir onerdi. Tutumunuz?',
      options: [
        { id: 'a', text: 'Prosedurlere bagli kalirim.', competency: 'LDR_04', score: 0 },
        { id: 'b', text: 'Risk analizi yapip desteklerim.', competency: 'LDR_01', score: 3 },
        { id: 'c', text: 'Ust yonetime ileterim.', competency: 'LDR_03', score: 2 },
        { id: 'd', text: 'Pilot uygulama oneririm.', competency: 'LDR_02', score: 3 }
      ]
    },
    {
      id: 4,
      question: 'Musteri toplantisinda ekibiniz hata yapti. Ne yaparsınız?',
      options: [
        { id: 'a', text: 'Sorumluyu uyaririm.', competency: 'LDR_03', score: 0 },
        { id: 'b', text: 'Hatay sahiplenirim.', competency: 'LDR_04', score: 3 },
        { id: 'c', text: 'Toplantiyi sonlandiririm.', competency: 'LDR_02', score: 1 },
        { id: 'd', text: 'Ozur diler telafi plani sunarim.', competency: 'LDR_03', score: 2 }
      ]
    }
  ];
}

function getFallbackEmails(session) {
  return [
    { id: 'email_1', from: 'Genel Mudur - Ahmet Kaya', subject: 'ACIL: SSB Heyeti Sunumu', body: 'Yarin sabah SSB heyeti geliyor. Proje durum raporu eksik, bu gece hazirlanmali.', time: '07:30', correctQuadrant: 'Q1', points: 20, explanation: 'Stratejik paysas, kurumsal risk tasiyor.' },
    { id: 'email_2', from: 'Proje Yoneticisi - Elif Sahin', subject: 'ACIL: Uretim Hatti Durma Riski', body: 'Kritik bilesen tedarikci teslimatı durdurdu. 48 saat icinde hat duracak.', time: '08:15', correctQuadrant: 'Q1', points: 20, explanation: 'Operasyonel kriz, hemen mudahale gerekiyor.' },
    { id: 'email_3', from: 'IK Muduru - Murat Demir', subject: 'Yetkinlik Gelisim Plani Revizyonu', body: 'Ekibinizin gelisim planini onumuzdeki ay basina kadar onaylamanizi rica ediyorum.', time: '09:00', correctQuadrant: 'Q2', points: 15, explanation: 'Onemli ama acil degil, planlanmali.' },
    { id: 'email_4', from: 'Strateji Direktoru - Ayse Yildiz', subject: '2026-2030 Ar-Ge Yol Haritasi', body: 'Uzun vadeli Ar-Ge stratejimizin taslağını hazirladim, goruslerinizi almak istiyorum.', time: '10:30', correctQuadrant: 'Q2', points: 15, explanation: 'Stratejik, planlanarak ele alinmali.' },
    { id: 'email_5', from: 'Sekreterya - Fatma Celik', subject: 'Toplanti Odasi Rezervasyonu', body: 'Persembe toplantisi icin oda rezervasyonu yapilmasi gerekiyor.', time: '11:00', correctQuadrant: 'Q3', points: 10, explanation: 'Delege edilebilir.' },
    { id: 'email_6', from: 'Satin Alma - Kemal Arslan', subject: 'Ofis Malzemeleri Onayi', body: 'Aylik ofis malzemeleri siparisi icin onayiniz gerekiyor. Toplam 2.300 TL.', time: '11:45', correctQuadrant: 'Q3', points: 10, explanation: 'Rutin, baskasina devredilebilir.' },
    { id: 'email_7', from: 'Sosyal Kulup - Zeynep Koc', subject: 'Yil Sonu Yemegi Oylamasi', body: 'Bu yilki yil sonu yemegi icin tarih ve mekan oylamasi basladi.', time: '12:30', correctQuadrant: 'Q4', points: 5, explanation: 'Ne acil ne onemli.' },
    { id: 'email_8', from: 'Dis Kaynak - Haber Bulteni', subject: 'Haftalik Savunma Sanayii Haberleri', body: 'Bu haftanin savunma sanayii haber ozeti ektedir.', time: '13:00', correctQuadrant: 'Q4', points: 5, explanation: 'Rutin bilgi, bos vakitte bakilabilir.' }
  ];
}

module.exports = router;
