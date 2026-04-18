const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildScenarioPrompt, loadRules, resolveDepartment } = require('../rules_engine');
const { getSessionWithFallback, updateSession } = require('../store/sessionStore');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helper: call Gemini safely ─────────────────────────────────────
async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ── Generate IceBreaker ────────────────────────────────────────────
router.post('/generate-icebreaker', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = await getSessionWithFallback(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  const rules = loadRules();
  const dept = resolveDepartment(session.department);
  const themes = dept?.themes?.join(', ') || 'genel mühendislik';
  const competencies = rules.CompetencyMap.competencies.map(c => `${c.id}: ${c.name}`).join(', ');

  const prompt = `Sen Roketsan A.Ş. için kıdemli bir liderlik değerlendirme uzmanısın.

ADAY BİLGİLERİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

DEPARTMAN TEMALARI: ${themes}
YETKİNLİKLER: ${competencies}

GÖREV: Bu adaya özel, ${session.position} pozisyonuna uygun 4 adet ısınma sorusu üret.
Sorular ${session.department} departmanının gerçek iş senaryolarını içermeli.
Her soru birbirinden farklı bir liderlik boyutunu ölçmeli.

KURALLAR:
- Türkçe karakterleri doğru kullan (ş, ğ, ü, ö, ç, ı, İ)
- Gerçekçi ve pozisyona özgü senaryolar
- 4 seçenek, her biri farklı yetkinlik puanı
- Sadece JSON döndür, başka hiçbir şey yazma

FORMAT:
{
  "questions": [
    {
      "id": 1,
      "question": "Soru metni",
      "options": [
        {"id": "a", "text": "Seçenek A", "competency": "LDR_01", "score": 3},
        {"id": "b", "text": "Seçenek B", "competency": "LDR_02", "score": 2},
        {"id": "c", "text": "Seçenek C", "competency": "LDR_03", "score": 1},
        {"id": "d", "text": "Seçenek D", "competency": "LDR_04", "score": 0}
      ]
    }
  ]
}`;

  try {
    const data = await callGemini(prompt);
    updateSession(session_id, { iceBreakerQuestions: data.questions });
    res.json({ success: true, questions: data.questions });
  } catch (err) {
    console.error('[generate-icebreaker]', err.message);
    res.json({ success: true, questions: getFallbackQuestions(session), demo: true });
  }
});

// ── Generate Scenario ──────────────────────────────────────────────
router.post('/generate-content', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = await getSessionWithFallback(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  const prompt = `Sen Roketsan A.Ş. için kıdemli bir liderlik değerlendirme uzmanısın.

ADAY BİLGİLERİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

GÖREV: Bu adaya özel, ${session.position} pozisyonunun sorumluluklarına uygun bir kriz senaryosu üret.
Senaryo ${session.department} departmanının gerçek operasyonel zorluklarını yansıtmalı.
${session.position} seviyesindeki bir kişinin yetkisi ve sorumluluğu dahilinde olmalı.

KURALLAR:
- Türkçe karakterleri doğru kullan (ş, ğ, ü, ö, ç, ı, İ)
- Gerçekçi, Roketsan'ın savunma sanayi bağlamına uygun
- Paydaşlar pozisyona göre belirlenmeli (ast/üst ilişkisi)
- Sadece JSON döndür

FORMAT:
{
  "title": "Senaryo başlığı",
  "urgency": "critical",
  "context": "Arka plan bilgisi (2-3 cümle)",
  "crisis": "Kriz durumu detayı (3-4 cümle)",
  "keyQuestion": "Ana soru - ${session.position} olarak ne yaparsınız?",
  "stakeholders": ["Paydaş 1", "Paydaş 2", "Paydaş 3"],
  "timeConstraint": "Zaman kısıtı",
  "expectedCompetencies": ["LDR_01", "LDR_02", "LDR_03"],
  "minWords": 100,
  "maxWords": 400
}`;

  try {
    const scenario = await callGemini(prompt);
    updateSession(session_id, { scenario });
    res.json({ success: true, scenario });
  } catch (err) {
    console.error('[generate-content]', err.message);
    const demo = getDemoScenario(session);
    updateSession(session_id, { scenario: demo });
    res.json({ success: true, scenario: demo, demo: true });
  }
});

// ── Generate Audio Case ────────────────────────────────────────────
router.post('/generate-audio-case', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = await getSessionWithFallback(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  const prompt = `Sen Roketsan A.Ş. için kıdemli bir liderlik değerlendirme uzmanısın.

ADAY BİLGİLERİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

GÖREV: Sesli yanıt modülü için yeni ve farklı bir vaka sorusu üret.
Bu soru senaryo modülündeki vakadan FARKLI olmalı.
${session.position} pozisyonuna özgü bir liderlik durumu içermeli.
Aday bu soruya 2-4 dakika sesli yanıt verecek.

KURALLAR:
- Türkçe karakterleri doğru kullan
- Tek bir açık uçlu soru olmalı
- Sadece JSON döndür

FORMAT:
{
  "caseTitle": "Vaka başlığı",
  "caseDescription": "Kısa vaka açıklaması (2-3 cümle)",
  "question": "Siz ${session.position} olarak bu durumda ne yaparsınız ve neden?",
  "context": "Ek bağlam bilgisi",
  "evaluationFocus": ["Değerlendirilecek boyut 1", "Boyut 2"]
}`;

  try {
    const audioCase = await callGemini(prompt);
    updateSession(session_id, { audioCase });
    res.json({ success: true, audioCase });
  } catch (err) {
    console.error('[generate-audio-case]', err.message);
    res.json({ success: true, audioCase: getFallbackAudioCase(session), demo: true });
  }
});

// ── Generate InTray Emails ─────────────────────────────────────────
router.post('/generate-intray', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = await getSessionWithFallback(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  const dept = resolveDepartment(session.department);
  const themes = dept?.themes?.join(', ') || 'genel';

  const prompt = `Sen Roketsan A.Ş. için kıdemli bir liderlik değerlendirme uzmanısın.

ADAY BİLGİLERİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

GÖREV: Bu adaya özel 8 adet gerçekçi iş e-postası üret.
E-postalar ${session.position} pozisyonunun gerçek iş tanımına ve sorumluluklarına uygun olmalı.
Gönderenler ${session.position} için mantıklı ast/üst/yan birim ilişkilerini yansıtmalı.
Departman bağlamı: ${themes}

DAĞILIM: 2xQ1(20pt acil+önemli), 2xQ2(15pt önemli+acil değil), 2xQ3(10pt acil+önemsiz), 2xQ4(5pt acil değil+önemsiz)

KURALLAR:
- Türkçe karakterleri doğru kullan (ş, ğ, ü, ö, ç, ı, İ)
- Her e-posta ${session.department} departmanına özgü olmalı
- Gönderenler gerçekçi Türk isimleri ve unvanları olmalı
- E-posta içerikleri 2-3 cümle
- Sadece JSON döndür

FORMAT:
{
  "emails": [
    {
      "id": "email_1",
      "from": "Ad Soyad - Unvan",
      "subject": "Konu başlığı",
      "body": "E-posta içeriği 2-3 cümle.",
      "time": "08:30",
      "correctQuadrant": "Q1",
      "points": 20,
      "explanation": "Neden bu kadranda olduğunun açıklaması"
    }
  ]
}`;

  try {
    const data = await callGemini(prompt);
    updateSession(session_id, { intrayEmails: data.emails });
    res.json({ success: true, emails: data.emails });
  } catch (err) {
    console.error('[generate-intray]', err.message);
    res.json({ success: true, emails: getFallbackEmails(session), demo: true });
  }
});

// ── Fallback functions ─────────────────────────────────────────────
function getDemoScenario(session) {
  return {
    title: `${session.department} Departmanı — Kritik Tedarik Krizi`,
    urgency: 'critical',
    context: `Roketsan güdüm sistemi projesinde tedarikçi teslimatı durdurdu. ${session.position} olarak durumu yönetmeniz gerekiyor.`,
    crisis: `${session.name}, üretim hattı 48 saat içinde duracak. DSB toplantısı 72 saat sonra yapılacak ve proje durumu raporlanacak.`,
    keyQuestion: `${session.position} olarak ilk 4 saatte hangi stratejik adımları atarsınız?`,
    stakeholders: ['Tedarik Zinciri Müdürü', 'Üretim Müdürü', 'Proje Yöneticisi'],
    timeConstraint: '48 saat içinde üretim hattı durma riski',
    expectedCompetencies: ['LDR_01', 'LDR_02'],
    minWords: 100,
    maxWords: 400
  };
}

function getFallbackAudioCase(session) {
  return {
    caseTitle: 'Ekip Çatışması Yönetimi',
    caseDescription: `${session.department} departmanında iki kıdemli çalışan arasında proje önceliklendirmesi konusunda ciddi bir anlaşmazlık yaşanıyor. Her ikisi de haklı gerekçelere sahip ancak süreç tıkandı.`,
    question: `Siz ${session.position} olarak bu çatışmayı nasıl yönetirsiniz ve ekibi nasıl yeniden aynı hedefe odaklarsınız?`,
    context: 'Proje teslim tarihi 3 hafta sonra. Her iki çalışan da kritik roller üstleniyor.',
    evaluationFocus: ['Çatışma yönetimi', 'Liderlik tarzı', 'İletişim becerisi']
  };
}

function getFallbackQuestions(session) {
  return [
    {
      id: 1,
      question: `${session.department} departmanında kritik bir proje gecikmesi yaşandı. ${session.position} olarak ilk tepkiniz ne olur?`,
      options: [
        { id: 'a', text: 'Ekibi toplayıp durum değerlendirmesi yaparım ve aksiyon planı oluştururum.', competency: 'LDR_01', score: 3 },
        { id: 'b', text: 'Üst yönetime derhal bilgi veririm ve onay beklerim.', competency: 'LDR_03', score: 1 },
        { id: 'c', text: 'Sorumlu kişiyi belirleyip hesap sorarım.', competency: 'LDR_02', score: 0 },
        { id: 'd', text: 'Kök neden analizi yaparak kalıcı çözüm üretirim.', competency: 'LDR_01', score: 2 }
      ]
    },
    {
      id: 2,
      question: 'İki kritik proje aynı anda son aşamaya geldi, kaynak yetersiz. Ne yaparsınız?',
      options: [
        { id: 'a', text: 'Stratejik öneme göre önceliklendirip kaynakları yönlendiririm.', competency: 'LDR_01', score: 3 },
        { id: 'b', text: 'Her iki projeye eşit kaynak ayırırım.', competency: 'LDR_02', score: 1 },
        { id: 'c', text: 'Ekiple birlikte karar veririm.', competency: 'LDR_03', score: 2 },
        { id: 'd', text: 'Müdürden yönlendirme isterim.', competency: 'LDR_04', score: 0 }
      ]
    },
    {
      id: 3,
      question: 'Ekibiniz yüksek riskli ama yenilikçi bir fikir önerdi. Tutumunuz?',
      options: [
        { id: 'a', text: 'Mevcut prosedürlere bağlı kalırım, risk almam.', competency: 'LDR_04', score: 0 },
        { id: 'b', text: 'Risk analizi yapıp desteklerim, gerekli önlemleri alırım.', competency: 'LDR_01', score: 3 },
        { id: 'c', text: 'Üst yönetime ileterek onay beklerim.', competency: 'LDR_03', score: 1 },
        { id: 'd', text: 'Küçük ölçekli pilot uygulama öneririm.', competency: 'LDR_02', score: 2 }
      ]
    },
    {
      id: 4,
      question: 'Önemli bir müşteri toplantısında ekibiniz kritik bir hata yaptı. Ne yaparsınız?',
      options: [
        { id: 'a', text: 'Sorumlu çalışanı toplantıda uyarırım.', competency: 'LDR_03', score: 0 },
        { id: 'b', text: 'Hatayı sahiplenirim, özür diler ve telafi planı sunarım.', competency: 'LDR_04', score: 3 },
        { id: 'c', text: 'Toplantıyı kısa keserim.', competency: 'LDR_02', score: 0 },
        { id: 'd', text: 'Durumu yönetir, sonrasında ekiple değerlendirme yaparım.', competency: 'LDR_01', score: 2 }
      ]
    }
  ];
}

function getFallbackEmails(session) {
  return [
    { id: 'email_1', from: 'Genel Müdür - Ahmet Kaya', subject: 'ACİL: SSB Heyeti Sunumu', body: 'Yarın sabah SSB heyeti geliyor. Proje durum raporu eksik, bu gece hazırlanmalı. Sizden destek bekliyorum.', time: '07:30', correctQuadrant: 'Q1', points: 20, explanation: 'Stratejik paydaş, kurumsal risk taşıyor, hemen ele alınmalı.' },
    { id: 'email_2', from: 'Proje Yöneticisi - Elif Şahin', subject: 'ACİL: Üretim Hattı Durma Riski', body: 'Kritik bileşen tedarikçisi teslimatı durdurdu. 48 saat içinde hat duracak. Acil karar gerekiyor.', time: '08:15', correctQuadrant: 'Q1', points: 20, explanation: 'Operasyonel kriz, hemen müdahale gerekiyor.' },
    { id: 'email_3', from: 'İK Müdürü - Murat Demir', subject: 'Yetkinlik Gelişim Planı Revizyonu', body: 'Ekibinizin gelişim planını önümüzdeki ay başına kadar onaylamanızı rica ediyorum. Taslak ekte.', time: '09:00', correctQuadrant: 'Q2', points: 15, explanation: 'Önemli ama acil değil, planlanmalı.' },
    { id: 'email_4', from: 'Strateji Direktörü - Ayşe Yıldız', subject: '2026-2030 Ar-Ge Yol Haritası', body: 'Uzun vadeli Ar-Ge stratejimizin taslağını hazırladım, görüşlerinizi almak istiyorum. Toplantı ayarlayalım mı?', time: '10:30', correctQuadrant: 'Q2', points: 15, explanation: 'Stratejik öneme sahip, planlanarak ele alınmalı.' },
    { id: 'email_5', from: 'Sekreterya - Fatma Çelik', subject: 'Toplantı Odası Rezervasyonu', body: 'Perşembe toplantısı için oda rezervasyonu yapılması gerekiyor. Onayınızı alabilir miyim?', time: '11:00', correctQuadrant: 'Q3', points: 10, explanation: 'Delege edilebilir rutin işlem.' },
    { id: 'email_6', from: 'Satın Alma - Kemal Arslan', subject: 'Ofis Malzemeleri Onayı', body: 'Aylık ofis malzemeleri siparişi için onayınız gerekiyor. Toplam 2.300 TL tutarında.', time: '11:45', correctQuadrant: 'Q3', points: 10, explanation: 'Rutin, başkasına devredilebilir.' },
    { id: 'email_7', from: 'Sosyal Kulüp - Zeynep Koç', subject: 'Yıl Sonu Yemeği Oylaması', body: 'Bu yılki yıl sonu yemeği için tarih ve mekan oylaması başladı. Oy kullanmayı unutmayın!', time: '12:30', correctQuadrant: 'Q4', points: 5, explanation: 'Ne acil ne önemli, boş vakitte bakılabilir.' },
    { id: 'email_8', from: 'Dış Kaynak - Haber Bülteni', subject: 'Haftalık Savunma Sanayii Haberleri', body: 'Bu haftanın savunma sanayii haber özeti ektedir. İyi okumalar.', time: '13:00', correctQuadrant: 'Q4', points: 5, explanation: 'Rutin bilgi bülteni, öncelik gerektirmiyor.' }
  ];
}

module.exports = router;