const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { loadRules, resolveDepartment } = require('../rules_engine');
const { getSessionWithFallback, updateSession } = require('../store/sessionStore');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helper: call Gemini safely ─────────────────────────────────────
async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ── Departmana özel bağlam oluştur ────────────────────────────────
function buildDepartmentContext(session) {
  const dept = resolveDepartment(session.department);
  const pos = session.position;

  const contexts = {
    'Güdüm ve Kontrol Sistemleri': {
      realProjects: 'HİSAR hava savunma sistemi, SOM seyir füzesi, AKINCI İHA güdüm sistemi',
      challenges: 'güdüm algoritması doğrulama, senaryo simülasyonu başarısızlığı, ihracat lisansı kısıtları',
      stakeholders: 'SSB Program Yöneticisi, Test ve Değerlendirme Direktörü, Tedarikçi Firması',
      kpis: 'CEP (Dairesel Hata Olasılığı), simülasyon doğruluk oranı, test başarı yüzdesi'
    },
    'Elektronik Sistemler': {
      realProjects: 'AESA radar sistemleri, elektronik harp sistemleri, avionik entegrasyon',
      challenges: 'EMI/EMC uyumluluk sorunu, bileşen tedarik kesintisi, RF performans sapması',
      stakeholders: 'Elektronik Konfigürasyon Komitesi, Kalite Direktörü, SSB Teknik Heyet',
      kpis: 'MTBF değeri, sistem güvenilirliği, doğrulama test kapsamı'
    },
    'Yazılım ve Simülasyon': {
      realProjects: 'Gerçek zamanlı simülasyon altyapısı, gömülü yazılım, HIL test sistemleri',
      challenges: 'yazılım gereksinimleri dondurma, kod kalite metrikleri sapması, entegrasyon hataları',
      stakeholders: 'Yazılım Konfigürasyon Yöneticisi, Sistem Mühendisleri, Müşteri Temsilcisi',
      kpis: 'kod kapsama oranı, yazılım hata yoğunluğu, entegrasyon test geçiş oranı'
    },
    'Üretim ve İmalat': {
      realProjects: 'Seri üretim hattı kurulumu, CNC işleme optimizasyonu, kaynak kalifikasyonu',
      challenges: 'hat duruşu, hammadde tedarik krizi, kalite reddine yol açan süreç sapması',
      stakeholders: 'Üretim Direktörü, Kalite Güvence Müdürü, Tedarik Zinciri Müdürü',
      kpis: 'OEE (Genel Ekipman Etkinliği), hurda oranı, zamanlama uyumu'
    },
    'Kalite Güvence': {
      realProjects: 'AS9100 sertifikasyon denetimi, birinci makale denetimi, tedarikçi kalifikasyonu',
      challenges: 'denetim bulgusu açık kalemler, NCR (uygunsuzluk raporu) yığılması, müşteri şikayeti',
      stakeholders: 'Kalite Direktörü, Denetim Komitesi, SSB Kalite Temsilcisi',
      kpis: 'NCR kapatma süresi, ilk geçiş oranı, tedarikçi kalite puanı'
    },
    'Program Yönetimi': {
      realProjects: 'T-129 ATAK helikopter avionik entegrasyonu, HISAR-A+ geliştirme programı',
      challenges: 'milestone kayması, bütçe aşımı, kritik kaynak çakışması, müşteri beklenti yönetimi',
      stakeholders: 'SSB Program Direktörü, Müşteri Teknik Heyeti, CFO, İcra Komitesi',
      kpis: 'SPI (Takvim Performans İndeksi), CPI (Maliyet Performans İndeksi), risk kapatma oranı'
    },
    'İş Geliştirme ve Pazarlama': {
      realProjects: 'DSEI, Eurosatory fuarları, ihracat müzakereleri, offset anlaşmaları',
      challenges: 'ihale takvimi sıkışması, rakip teklif analizi, müşteri ülke kısıtlamaları',
      stakeholders: 'Genel Müdür, SSB, Savunma Bakanlığı temsilcisi, Uluslararası ortak firma',
      kpis: 'teknik skor, teklif kazanma oranı, ihracat geliri'
    },
    'Tedarik Zinciri ve Lojistik': {
      realProjects: 'kritik alt sistem tedariki, yerli ikame geliştirme, stratejik stok yönetimi',
      challenges: 'tek kaynaklı tedarikçi riski, ihracat yasağı, hammadde fiyat artışı, teslimat gecikmesi',
      stakeholders: 'Tedarikçi Firması, Üretim Direktörü, Hukuk Departmanı, Finans',
      kpis: 'tedarikçi OTD oranı, stok devir hızı, alternatif kaynak sayısı'
    },
    'İnsan Kaynakları': {
      realProjects: 'Kritik mühendis işe alım kampanyası, yetenek yönetimi programı, organizasyon yeniden yapılanma',
      challenges: 'kritik pozisyon boşluğu, yüksek işten ayrılma oranı, performans yönetimi krizi',
      stakeholders: 'Genel Müdür, Bölüm Direktörleri, Çalışan Temsilcisi',
      kpis: 'işe alım süresi, çalışan bağlılık skoru, kritik pozisyon doluluk oranı'
    },
    'Finans ve Bütçe': {
      realProjects: 'Ar-Ge bütçe planlaması, proje maliyet analizi, TÜBİTAK hibe yönetimi',
      challenges: 'bütçe sapması, döviz kuru riski, maliyet aşımı, tahsilat gecikmesi',
      stakeholders: 'CFO, Program Yöneticileri, SSB Mali Denetim, Bağımsız Denetçi',
      kpis: 'bütçe varyansı, nakit akış tahmin doğruluğu, proje kârlılık marjı'
    },
    'Savunma Sistem Entegrasyonu': {
      realProjects: 'HISAR sistemi platform entegrasyonu, milli muharip uçak alt sistem entegrasyonu',
      challenges: 'arayüz uyumsuzluğu, entegrasyon testi başarısızlığı, zaman kısıtı altında doğrulama',
      stakeholders: 'Platform Sahibi, Sistem Mühendisliği Direktörü, SSB Teknik Heyet',
      kpis: 'entegrasyon testi geçiş oranı, arayüz uyumsuzluk sayısı, doğrulama kapsamı'
    }
  }

  // Varsayılan bağlam
  const defaultContext = {
    realProjects: 'Roketsan stratejik savunma sistemleri projeleri',
    challenges: 'teknik ve operasyonel kriz yönetimi',
    stakeholders: 'Direktör, Müdür, SSB Temsilcisi',
    kpis: 'proje performansı, kalite, zamanlama'
  }

  return contexts[session.department] || defaultContext
}

// ── Generate IceBreaker ────────────────────────────────────────────
router.post('/generate-icebreaker', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id gerekli' });
  const session = await getSessionWithFallback(session_id);
  if (!session) return res.status(404).json({ error: 'Oturum bulunamadı' });

  const rules = loadRules();
  const deptContext = buildDepartmentContext(session);
  const competencies = rules.CompetencyMap.competencies.map(c => `${c.id}: ${c.name} (ağırlık: ${c.weight})`).join('\n');

  const prompt = `Sen Roketsan A.Ş. için uzman bir Assessment Center değerlendirme danışmanısın.

ADAY PROFİLİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

DEPARTMAN BAĞLAMI:
- Roketsan'daki Gerçek Projeler: ${deptContext.realProjects}
- Tipik Zorluklar: ${deptContext.challenges}
- Paydaşlar: ${deptContext.stakeholders}
- KPI'lar: ${deptContext.kpis}

YETKİNLİKLER:
${competencies}

GÖREV: Bu adaya ÖZEL, ${session.position} unvanının gerçek sorumluluklarını yansıtan 4 adet ısınma sorusu üret.

KRİTİK KURALLAR:
1. Her soru ${session.department} departmanının GERÇEK iş senaryolarını içermeli
2. Sorular birbirinden TAMAMEN FARKLI liderlik boyutlarını ölçmeli
3. ${session.position} seviyesinin yetki alanına uygun olmalı
4. Seçenekler net ayırt edici olmalı — en iyi ile en kötü cevap açıkça belli olmalı
5. Türkçe karakterleri doğru kullan (ş, ğ, ü, ö, ç, ı, İ)
6. SADECE JSON döndür, başka hiçbir şey yazma

SENARYO ÖRNEKLERİ: ${deptContext.challenges} konularını kullan

FORMAT:
{
  "questions": [
    {
      "id": 1,
      "question": "Spesifik ve gerçekçi senaryo sorusu (2-3 cümle, ${session.department} bağlamında)",
      "options": [
        {"id": "a", "text": "En iyi liderlik davranışı (somut, ölçülebilir aksiyon)", "competency": "LDR_01", "score": 3},
        {"id": "b", "text": "İyi ama eksik davranış", "competency": "LDR_02", "score": 2},
        {"id": "c", "text": "Kabul edilebilir ama yetersiz davranış", "competency": "LDR_03", "score": 1},
        {"id": "d", "text": "Liderlik açısından zayıf davranış", "competency": "LDR_04", "score": 0}
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

  const deptContext = buildDepartmentContext(session);

  const prompt = `Sen Roketsan A.Ş. için uzman bir Assessment Center değerlendirme danışmanısın. Türkiye'nin önde gelen savunma sanayii şirketi olan Roketsan'ın gerçek operasyonel bağlamını çok iyi biliyorsun.

ADAY PROFİLİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

ROKETSAN DEPARTMAN BAĞLAMI:
- Aktif Projeler: ${deptContext.realProjects}
- Kritik Zorluk Alanları: ${deptContext.challenges}
- Kilit Paydaşlar: ${deptContext.stakeholders}
- Başarı Göstergeleri: ${deptContext.kpis}

GÖREV: ${session.name} için ÖZGÜN ve GERÇEKÇİ bir kriz senaryosu üret.

KRİTİK KURALLAR:
1. Senaryo YALNIZCA ${session.department} departmanının gerçek iş akışlarını yansıtmalı
2. Kriz ${session.position} seviyesinin GERÇEK yetki alanında olmalı
3. Paydaşlar pozisyona göre mantıklı ast/üst ilişkisi içinde olmalı
4. Zaman baskısı gerçekçi ve kritik olmalı
5. Roketsan'ın savunma sanayi bağlamı (SSB, MİLGEM, HISAR, SOM vb.) kullanılabilir
6. Türkçe karakterleri doğru kullan
7. SADECE JSON döndür

FORMAT:
{
  "title": "Kısa, çarpıcı kriz başlığı",
  "urgency": "critical",
  "context": "2-3 cümle arka plan — pozisyon ve departman için özgün",
  "crisis": "3-4 cümle kriz detayı — spesifik rakamlar, tarihler, paydaşlar içermeli",
  "keyQuestion": "${session.position} olarak ilk 4 saatte hangi kritik kararları alırsınız ve nasıl uygularsınız?",
  "stakeholders": ["Spesifik paydaş 1 ve unvanı", "Paydaş 2", "Paydaş 3", "Paydaş 4"],
  "timeConstraint": "Spesifik zaman kısıtı",
  "expectedCompetencies": ["LDR_01", "LDR_02", "LDR_03"],
  "minWords": 150,
  "maxWords": 500
}`;

  try {
    const scenario = await callGemini(prompt);
    updateSession(session_id, { scenario });
    res.json({ success: true, scenario });
  } catch (err) {
    console.error('[generate-content]', err.message);
    const demo = getDemoScenario(session, buildDepartmentContext(session));
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

  const deptContext = buildDepartmentContext(session);

  const prompt = `Sen Roketsan A.Ş. için uzman bir Assessment Center değerlendirme danışmanısın.

ADAY PROFİLİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

DEPARTMAN BAĞLAMI: ${deptContext.realProjects} | ${deptContext.challenges}

GÖREV: Sesli yanıt için ÖZGÜN bir liderlik vakası üret. Bu vaka senaryo modülündekinden TAMAMEN FARKLI bir konu ve bağlam içermeli.

KRİTİK KURALLAR:
1. Vaka ${session.department} gerçeğini yansıtmalı ama senaryo modülüyle çakışmamalı
2. Aday 2-4 dakika içinde kapsamlı yanıt verebilmeli
3. Soru açık uçlu ve çok boyutlu olmalı
4. Liderlik tarzı, ekip yönetimi, etik karar verme gibi boyutları ölçmeli
5. Türkçe karakterleri doğru kullan
6. SADECE JSON döndür

FORMAT:
{
  "caseTitle": "Vaka başlığı",
  "caseDescription": "2-3 cümle vaka bağlamı — ${session.department} departmanına özgün",
  "question": "${session.position} olarak bu durumda nasıl bir liderlik yaklaşımı sergilersiniz? Kararlarınızın arkasındaki mantığı ve uygulama adımlarını açıklayınız.",
  "context": "Ek bağlam ve kısıtlar",
  "evaluationFocus": ["Ölçülen boyut 1", "Boyut 2", "Boyut 3"]
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

  const deptContext = buildDepartmentContext(session);

  const prompt = `Sen Roketsan A.Ş. için uzman bir Assessment Center değerlendirme danışmanısın.

ADAY PROFİLİ:
- Ad Soyad: ${session.name}
- Departman: ${session.department}
- Pozisyon: ${session.position}

DEPARTMAN BAĞLAMI:
- Projeler: ${deptContext.realProjects}
- Tipik Zorluklar: ${deptContext.challenges}
- Paydaşlar: ${deptContext.stakeholders}

GÖREV: Bu adaya ÖZEL 8 adet gerçekçi iş e-postası üret.

KRİTİK KURALLAR:
1. Her e-posta ${session.department} departmanının GERÇEK iş akışlarını yansıtmalı
2. Gönderenler ${session.position} için mantıklı hiyerarşik ilişkiler içinde olmalı (ast/üst/yan birim)
3. E-posta konuları birbirinden TAMAMEN FARKLI olmalı
4. Her e-postanın neden o kadranda olduğu AÇIK olmalı
5. Gerçekçi Türk isimleri ve unvanları kullan
6. Türkçe karakterleri doğru kullan (ş, ğ, ü, ö, ç, ı, İ)
7. SADECE JSON döndür

DAĞILIM (kesinlikle uy):
- 2 adet Q1 (ACİL + ÖNEMLİ): 20 puan — operasyonel kriz, üst yönetim talebi
- 2 adet Q2 (ÖNEMLİ + ACİL DEĞİL): 15 puan — stratejik planlama, gelişim aktiviteleri
- 2 adet Q3 (ACİL + ÖNEMSİZ): 10 puan — rutin onay, koordinasyon
- 2 adet Q4 (ACİL DEĞİL + ÖNEMSİZ): 5 puan — bilgi amaçlı, sosyal

FORMAT:
{
  "emails": [
    {
      "id": "email_1",
      "from": "Ad Soyad — Unvan (${session.department} bağlamına uygun)",
      "subject": "Spesifik ve gerçekçi konu başlığı",
      "body": "E-posta içeriği — 2-3 cümle, somut bilgi içermeli.",
      "time": "08:30",
      "correctQuadrant": "Q1",
      "points": 20,
      "explanation": "Neden bu kadranda: spesifik gerekçe"
    }
  ]
}`;

  try {
    const data = await callGemini(prompt);
    updateSession(session_id, { intrayEmails: data.emails });
    res.json({ success: true, emails: data.emails });
  } catch (err) {
    console.error('[generate-intray]', err.message);
    res.json({ success: true, emails: getFallbackEmails(session, deptContext), demo: true });
  }
});

// ── Fallback functions ─────────────────────────────────────────────
function getDemoScenario(session, ctx) {
  return {
    title: `${session.department} — Kritik Operasyonel Kriz`,
    urgency: 'critical',
    context: `Roketsan ${session.department} departmanında ${ctx.realProjects} kapsamında kritik bir sorun tespit edildi. ${session.position} olarak durumu yönetmeniz gerekmektedir.`,
    crisis: `${session.name}, ${ctx.challenges} konusunda acil müdahale gerekiyor. ${ctx.stakeholders} ile koordineli hareket edilmesi şart. Süreç ${ctx.kpis} metriklerini doğrudan etkilemektedir.`,
    keyQuestion: `${session.position} olarak ilk 4 saatte hangi kritik kararları alırsınız?`,
    stakeholders: ctx.stakeholders.split(', '),
    timeConstraint: '24 saat içinde aksiyon planı sunulmalı',
    expectedCompetencies: ['LDR_01', 'LDR_02', 'LDR_03'],
    minWords: 150,
    maxWords: 500
  };
}

function getFallbackAudioCase(session) {
  return {
    caseTitle: 'Çapraz Fonksiyonel Ekip Çatışması',
    caseDescription: `${session.department} departmanında iki kritik proje aynı anda son aşamaya geldi. Kaynaklar yetersiz ve her iki proje yöneticisi öncelik talep ediyor.`,
    question: `${session.position} olarak bu kaynak çatışmasını nasıl yönetirsiniz? Kararınızın arkasındaki mantığı ve uygulama adımlarını açıklayınız.`,
    context: 'Her iki projenin müşteriye taahhüt edilmiş teslim tarihleri var. Gecikme durumunda cezai şart devreye girecek.',
    evaluationFocus: ['Önceliklendirme ve karar verme', 'Paydaş yönetimi', 'Kaynak optimizasyonu', 'Liderlik tarzı']
  };
}

function getFallbackQuestions(session) {
  return [
    {
      id: 1,
      question: `${session.department} departmanında kritik bir proje ${session.position} bilgisi olmadan müşteriye teslim edildi ve hatalı çıktı içeriyor. Durumdan 2 saat önce haberdar oldunuz. Ne yaparsınız?`,
      options: [
        { id: 'a', text: 'Müşteriyi derhal arayarak durumu şeffaf şekilde açıklar, özür diler ve 24 saat içinde düzeltici aksiyon planı sunarım.', competency: 'LDR_04', score: 3 },
        { id: 'b', text: 'Önce ekiple acil toplantı yapıp hatanın boyutunu anlar, sonra müşteriyle iletişime geçerim.', competency: 'LDR_01', score: 2 },
        { id: 'c', text: 'Sorumlu kişiyi tespit edip hesap sorar, sonra durumu üst yönetime bildiririm.', competency: 'LDR_02', score: 1 },
        { id: 'd', text: 'Müşterinin fark etmesini bekler, sonra duruma göre hareket ederim.', competency: 'LDR_03', score: 0 }
      ]
    },
    {
      id: 2,
      question: `${session.department} biriminizde en kıdemli mühendis istifa kararını bildirdi. Bu kişi kritik bir projenin tek teknik yetkilisi. Projenin teslim tarihi 3 ay sonra. İlk aksiyonunuz ne olur?`,
      options: [
        { id: 'a', text: 'Kişiyle birebir görüşüp istifa nedenini anlar, mümkünse çözüm ararım; paralelde bilgi aktarım planı ve yedekleme stratejisi oluştururum.', competency: 'LDR_03', score: 3 },
        { id: 'b', text: 'İK ile koordineli olarak acil işe alım süreci başlatır, mevcut ekiple proje risklerini değerlendiririm.', competency: 'LDR_01', score: 2 },
        { id: 'c', text: 'Durumu yönetime bildirerek onlardan yönlendirme isterim.', competency: 'LDR_02', score: 1 },
        { id: 'd', text: 'Projeyi dondurup yeni kaynak gelene kadar beklerim.', competency: 'LDR_04', score: 0 }
      ]
    },
    {
      id: 3,
      question: `SSB heyeti yarın ${session.department} departmanını denetleyecek. Ancak dün akşam kritik bir teknik sorun tespit ettiniz — rapor edilmezse denetim geçer, edilirse proje gecikmesi kaçınılmaz. Ne yaparsınız?`,
      options: [
        { id: 'a', text: 'Sorunu bugün gece yarısına kadar dokümante eder, sabah erken SSB ekibini bilgilendirerek çözüm planımı sunarım. Şeffaflıktan taviz vermem.', competency: 'LDR_04', score: 3 },
        { id: 'b', text: 'Üst yönetimle acil görüşüp kararı birlikte alırız; her koşulda etik çizgimizi koruruz.', competency: 'LDR_01', score: 2 },
        { id: 'c', text: 'Denetim sonrası sorunu raporlarım, denetimden çıkınca zaten çözüme odaklanabiliriz.', competency: 'LDR_02', score: 1 },
        { id: 'd', text: 'Sorunun görünür olmadığını düşünerek denetimin geçmesini beklerim.', competency: 'LDR_03', score: 0 }
      ]
    },
    {
      id: 4,
      question: `${session.department} ekibiniz son 3 aydır aşırı mesai yapıyor ve motivasyon belirgin şekilde düştü. Bir çalışan burnout geçirdiğini belirtti. Proje baskısı devam ediyor. Nasıl yaklaşırsınız?`,
      options: [
        { id: 'a', text: 'Ekiple bireysel görüşmeler yaparak durumu dinler, iş yükünü yeniden dengelerim. Gerekirse proje paydaşlarına takvim revizesi öneririm — insan sağlığı önceliktir.', competency: 'LDR_03', score: 3 },
        { id: 'b', text: 'Kritik görevleri önceliklendirerek bazı işleri erteler veya dış kaynak kullanırım.', competency: 'LDR_01', score: 2 },
        { id: 'c', text: 'Ekibe motivasyonel konuşma yapar, proje bitmeden sonra izin vereceğimi söylerim.', competency: 'LDR_02', score: 1 },
        { id: 'd', text: 'Bu dönem kritik, proje bitene kadar devam etmelerini beklerim.', competency: 'LDR_04', score: 0 }
      ]
    }
  ];
}

function getFallbackEmails(session, ctx) {
  return [
    {
      id: 'email_1',
      from: `Ahmet Kaya — ${session.department} Direktörü`,
      subject: `ACİL: SSB Teknik Heyet Toplantısı — Yarın 09:00`,
      body: `SSB'den yarın sabah 09:00'da teknik heyet ziyareti var. ${ctx.realProjects} kapsamındaki son ilerleme raporunu bugün 18:00'e kadar hazırlamanızı bekliyorum. Detaylar ekte.`,
      time: '07:15',
      correctQuadrant: 'Q1',
      points: 20,
      explanation: 'SSB ziyareti kurumsal öncelik, Direktör talebi, 18:00 deadline — hem acil hem çok önemli.'
    },
    {
      id: 'email_2',
      from: `Elif Şahin — Tedarik Zinciri Müdürü`,
      subject: 'ACİL: Kritik Bileşen Teslimatı Durdu — Hat Riski',
      body: `${ctx.realProjects} için gereken kritik bileşenin tedarikçisi ihracat lisansı askıya alındığı gerekçesiyle teslimatı durdurdu. Stokta 48 saatlik malzeme var. Acil karar gerekiyor.`,
      time: '08:30',
      correctQuadrant: 'Q1',
      points: 20,
      explanation: 'Üretim hattı durma riski, 48 saat kritik pencere — hem acil hem çok önemli.'
    },
    {
      id: 'email_3',
      from: `Murat Demir — İnsan Kaynakları Müdürü`,
      subject: `${session.department} Yetkinlik Gelişim Planı — Q3 Revizyon`,
      body: `Ekibinizin 2024 yetkinlik gelişim planını bir sonraki dönem için revize etmemiz gerekiyor. Bireysel gelişim hedeflerini de içeren taslağı önümüzdeki ay sonuna kadar onaylamanızı rica ediyorum.`,
      time: '09:15',
      correctQuadrant: 'Q2',
      points: 15,
      explanation: 'Ekip gelişimi stratejik önem taşır ancak acil değil — planlanarak ele alınmalı.'
    },
    {
      id: 'email_4',
      from: `Zeynep Arslan — Strateji ve Planlama Direktörü`,
      subject: `2025-2030 Teknoloji Yol Haritası — Girdi Talebi`,
      body: `${session.department} biriminin önümüzdeki 5 yıllık teknolojik önceliklerini ve yatırım ihtiyaçlarını içeren girdileri strateji belgesi için bekliyorum. 3 hafta sonraki Yönetim Kurulu sunumuna dahil edilecek.`,
      time: '10:00',
      correctQuadrant: 'Q2',
      points: 15,
      explanation: 'YK\'ya gidecek stratejik doküman — önemli ama 3 hafta süresi var, planlanabilir.'
    },
    {
      id: 'email_5',
      from: `Fatma Çelik — Departman Sekreteri`,
      subject: 'Aylık Departman Toplantısı — Oda Rezervasyonu Onayı',
      body: `Perşembe günkü aylık departman toplantısı için Toplantı Odası B rezervasyonu yapılacak. Saat 14:00-16:00 uygun mu? Onayınızı alabilir miyim?`,
      time: '10:45',
      correctQuadrant: 'Q3',
      points: 10,
      explanation: 'Rutin koordinasyon — acil görünse de önem düşük, asistana devredilebilir.'
    },
    {
      id: 'email_6',
      from: `Kemal Yıldız — Satın Alma Uzmanı`,
      subject: 'Ofis Malzemeleri Siparişi — Müdür Onayı Gerekiyor',
      body: `${session.department} birimi için aylık ofis malzemeleri siparişini onaylamanız gerekiyor. Toplam tutar 3.750 TL. Tedarikçi listesi ve fiyat karşılaştırması ekte mevcut.`,
      time: '11:30',
      correctQuadrant: 'Q3',
      points: 10,
      explanation: 'Rutin satın alma onayı — devredilebilir, önem düzeyi düşük.'
    },
    {
      id: 'email_7',
      from: `Roketsan Sosyal Kulüp`,
      subject: 'Yıllık Piknik Organizasyonu — Tarih Anketi',
      body: `Bu yılki yıllık piknik için tarih belirleme anketimiz başladı. Tercih ettiğiniz tarihi belirtmek için aşağıdaki bağlantıya tıklayabilirsiniz. Katılım gönüllülük esasına dayanmaktadır.`,
      time: '12:00',
      correctQuadrant: 'Q4',
      points: 5,
      explanation: 'Sosyal etkinlik anketi — ne acil ne önemli, boş vakitte bakılabilir.'
    },
    {
      id: 'email_8',
      from: `Savunma Sanayii Bülteni`,
      subject: 'Haftalık Sektör Özeti — Uluslararası Savunma Haberleri',
      body: `Bu haftanın uluslararası savunma sanayii gelişmeleri: DSEI fuarı haberleri, NATO tedarik politikaları ve sektördeki teknoloji trendleri özetlenmiştir. Detaylı okuma için ekte PDF bulunmaktadır.`,
      time: '13:00',
      correctQuadrant: 'Q4',
      points: 5,
      explanation: 'Haftalık bilgi bülteni — rutin bilgilendirme, öncelik gerektirmiyor.'
    }
  ];
}

module.exports = router;
