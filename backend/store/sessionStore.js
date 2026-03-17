const supabase = require('./supabase');

const sessions = new Map();

function createSession(data) {
  return { ...data, createdAt: new Date().toISOString(), history: [] };
}

function getSession(id) {
  return sessions.get(id) || null;
}

function setSession(id, data) {
  sessions.set(id, data);
}

function updateSession(id, updates) {
  const existing = sessions.get(id);
  if (!existing) return false;
  sessions.set(id, { ...existing, ...updates });
  return true;
}

function deleteSession(id) {
  return sessions.delete(id);
}

// ─── Supabase: Adayı kaydet ──────────────────────────────────────────────────
async function saveCandidate(sessionData) {
  try {
    const { error } = await supabase.from('candidates').upsert({
      session_id: sessionData.session_id,
      name: sessionData.name,
      department: sessionData.department,
      position: sessionData.position,
      hierarchy_level: sessionData.hierarchyLevel
    });
    if (error) console.error('[Supabase] saveCandidate error:', error.message);
  } catch (err) {
    console.error('[Supabase] saveCandidate exception:', err.message);
  }
}

// ─── Supabase: Sonuçları kaydet ──────────────────────────────────────────────
async function saveResults(session_id, results) {
  try {
    const scores = [];
    if (results.iceBreakerResult) scores.push(20);
    if (results.scenarioResult) scores.push(20);
    if (results.audioResult) scores.push(results.audioResult.overallScore || 0);
    if (results.intrayResult) scores.push(results.intrayResult.percentage || 0);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const grade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B+' :
      overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C+' : 'C';

    const { error } = await supabase.from('assessment_results').upsert({
      session_id,
      icebreaker_result: results.iceBreakerResult || null,
      scenario: results.scenario || null,
      scenario_report: results.scenarioResult?.report || null,
      audio_result: results.audioResult || null,
      intray_result: results.intrayResult || null,
      overall_score: overallScore,
      grade,
      completed_at: new Date().toISOString()
    });
    if (error) console.error('[Supabase] saveResults error:', error.message);
    return { overallScore, grade };
  } catch (err) {
    console.error('[Supabase] saveResults exception:', err.message);
    return { overallScore: 0, grade: 'N/A' };
  }
}

// ─── Supabase: Tüm adayları getir ───────────────────────────────────────────
async function getAllCandidates() {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select(`*, assessment_results(*)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] getAllCandidates error:', err.message);
    return [];
  }
}

module.exports = {
  createSession, getSession, setSession,
  updateSession, deleteSession,
  saveCandidate, saveResults, getAllCandidates
};