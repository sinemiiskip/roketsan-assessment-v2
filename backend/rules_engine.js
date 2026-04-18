const fs = require('fs');
const path = require('path');
const RULES_PATH = path.join(__dirname, 'rules.json');

function loadRules() {
  try { return JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8')); }
  catch (err) { console.error('[RulesEngine] rules.json error:', err.message); return null; }
}

function resolveDepartment(departmentName) {
  const rules = loadRules();
  if (!rules) return null;
  const dep = departmentName.toLowerCase();
  return rules.DepartmentThemes.departments.find(d =>
    d.aliases.some(a => dep.includes(a.toLowerCase()))
  ) || rules.DepartmentThemes.departments[0];
}

function resolveHierarchyLevel(position) {
  const rules = loadRules();
  if (!rules) return { id: 'POZ_01', title: 'Mühendis', difficulty: 1, authorityScope: 'Teknik', timeLimit: 300, aiScenarioFocus: 'Teknik durumlar', scenarioComplexity: 'Düşük', matchKeywords: [] };
  const pos = position.toLowerCase();
  const levels = rules.HierarchyMatrix.levels;
  for (const level of [...levels].reverse()) {
    if (level.matchKeywords.some(kw => pos.includes(kw.toLowerCase()))) return level;
  }
  return levels[0];
}

function buildScenarioPrompt(userInfo, hierarchyLevel) {
  const rules = loadRules();
  if (!rules) return '';
  const dept = resolveDepartment(userInfo.department);
  const competencyList = rules.CompetencyMap.competencies.map(c => `- ${c.name} (ağırlık: ${c.weight})`).join('\n');
  const themes = dept ? dept.themes.join(', ') : 'genel kriz';
  const terms = dept ? dept.criticalTerms.join(', ') : '';
  return `Sen Roketsan A.Ş. liderlik değerlendirme simülasyonu için senaryo üreticisisin.
KULLANICI: ${userInfo.name} | DEPARTMAN: ${userInfo.department} | POZİSYON: ${userInfo.position}
YETKİ: ${hierarchyLevel.authorityScope} | ZORLUK: ${hierarchyLevel.scenarioComplexity}
DEPARTMAN ODAĞI: ${dept ? dept.aiInstruction : ''} | TEMALAR: ${themes} | TERİMLER: ${terms}
HİYERARŞİ ODAĞI: ${hierarchyLevel.aiScenarioFocus}
YETKİNLİKLER:\n${competencyList}
KURAL: Sadece JSON döndür, Türkçe, gerçekçi savunma sanayii senaryosu.
FORMAT: {"title":"...","urgency":"critical|high|medium","context":"...","crisis":"...","keyQuestion":"...","stakeholders":["..."],"timeConstraint":"...","expectedCompetencies":["LDR_01"]}`;
}

function evaluateTranscript(transcript) {
  const rules = loadRules();
  if (!rules) return { overallScore: 0 };
  const { CompetencyMap, AcousticRubric } = rules;

  // Guard against missing scoringWeights
  const w = AcousticRubric?.scoringWeights || { content: 0.5, delivery: 0.3, structure: 0.2 };

  const words = transcript.trim().split(/\s+/);
  const wordCount = words.length;
  const fillerCount = words.filter(w => AcousticRubric?.fillerWords?.includes(w.toLowerCase())).length;
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

  let contentScore = 0;
  const competencyScores = {};
  CompetencyMap.competencies.forEach(comp => {
    const matched = comp.keywords.filter(kw => transcript.toLowerCase().includes(kw.toLowerCase()));
    const negMatched = (comp.negativeKeywords || []).filter(kw => transcript.toLowerCase().includes(kw.toLowerCase()));
    const raw = comp.keywords.length > 0 ? (matched.length / Math.min(comp.keywords.length, 10)) * 100 : 50;
    const adjusted = Math.max(0, Math.min(100, raw - negMatched.length * 15));
    competencyScores[comp.id] = { name: comp.name, score: Math.round(adjusted), matched, weight: comp.weight };
    contentScore += adjusted * comp.weight;
  });

  let sentimentBonus = 0;
  const detectedTones = [];
  AcousticRubric?.parameters?.find(p => p.id === 'SENTIMENT')?.tones.forEach(t => {
    const hit = t.keywords?.some(kw => transcript.toLowerCase().includes(kw.toLowerCase()));
    if (hit) { sentimentBonus += t.score; detectedTones.push(t.tone); }
  });

  const deliveryScore = Math.max(0, Math.min(100, 70 - fillerRatio * 30 + Math.min(sentimentBonus, 20)));
  const structureScore = wordCount < 30 ? 20 : wordCount < 80 ? 50 : wordCount < 150 ? 75 : 90;
  const overallScore = Math.round(contentScore * w.content + deliveryScore * w.delivery + structureScore * w.structure);

  const feedback = [];
  if (fillerRatio > 0.05) feedback.push(`Dolgu kelime oranı yüksek (%${Math.round(fillerRatio * 100)}).`);
  if (wordCount < 50) feedback.push('Yanıt çok kısa.');

  return { competencyScores, contentScore: Math.round(contentScore), deliveryScore: Math.round(deliveryScore), structureScore: Math.round(structureScore), overallScore: Math.max(0, Math.min(100, overallScore)), wordCount, fillerWordCount: fillerCount, detectedTones, feedback };
}

function scoreInTray(userSelections) {
  const rules = loadRules();
  if (!rules) return { totalScore: 0, percentage: 0, results: [] };
  const { InTrayMatrix } = rules;
  let totalScore = 0;
  const results = [];
  InTrayMatrix.emails.forEach(email => {
    const userChoice = userSelections[email.id];
    if (!userChoice) return;
    const isCorrect = userChoice === email.correctQuadrant;
    const earnedPoints = isCorrect ? email.points : Math.round(email.points * InTrayMatrix.scoring.adjacentQuadrantPenalty);
    totalScore += earnedPoints;
    results.push({ emailId: email.id, subject: email.subject, from: email.from, userChoice, correctAnswer: email.correctQuadrant, isCorrect, earnedPoints, maxPoints: email.points, explanation: email.explanation });
  });
  const maxScore = InTrayMatrix.scoring.perfectScore;
  return { totalScore, maxScore, percentage: Math.round((totalScore / maxScore) * 100), results, grade: getGrade(totalScore, maxScore) };
}

function validateAuthorizedUser(username, password) {
  const rules = loadRules();
  if (!rules) return null;
  return rules.AuthorizedUsers.users.find(u => u.username === username && u.password === password) || null;
}

function getGrade(score, max) {
  const p = (score / max) * 100;
  if (p >= 90) return 'A'; if (p >= 80) return 'B+'; if (p >= 70) return 'B';
  if (p >= 60) return 'C+'; if (p >= 50) return 'C'; return 'D';
}

module.exports = { loadRules, resolveHierarchyLevel, resolveDepartment, buildScenarioPrompt, evaluateTranscript, scoreInTray, validateAuthorizedUser };
