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
  // Also persist to Supabase immediately
  supabase.from('candidates').upsert({
    session_id: data.session_id,
    name: data.name,
    department: data.department,
    position: data.position,
    hierarchy_level: data.hierarchyLevel,
    session_data: data
  }).then(({ error }) => {
    if (error) console.error('[Supabase] setSession error:', error.message);
  });
}

function updateSession(id, updates) {
  const existing = sessions.get(id);
  if (!existing) return false;
  const updated = { ...existing, ...updates };
  sessions.set(id, updated);
  // Persist updates to Supabase
  supabase.from('candidates').upsert({
    session_id: id,
    name: updated.name,
    department: updated.department,
    position: updated.position,
    hierarchy_level: updated.hierarchyLevel,
    session_data: updated
  }).then(({ error }) => {
    if (error) console.error('[Supabase] updateSession error:', error.message);
  });
  return true;
}

async function getSessionWithFallback(id) {
  // Try memory first
  const memSession = sessions.get(id);
  if (memSession) return memSession;

  // Fall back to Supabase
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('session_data')
      .eq('session_id', id)
      .single();
    if (error || !data?.session_data) return null;
    // Restore to memory
    sessions.set(id, data.session_data);
    return data.session_data;
  } catch (err) {
    console.error('[Supabase] getSessionWithFallback error:', err.message);
    return null;
  }
}

function deleteSession(id) {
  return sessions.delete(id);
}

async function saveCandidate(sessionData) {
  try {
    const { error } = await supabase.from('candidates').upsert({
      session_id: sessionData.session_id,
      name: sessionData.name,
      department: sessionData.department,
      position: sessionData.position,
      hierarchy_level: sessionData.hierarchyLevel,
      session_data: sessionData
    });
    if (error) console.error('[Supabase] saveCandidate error:', error.message);
  } catch (err) {
    console.error('[Supabase] saveCandidate exception:', err.message);
  }
}

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
  getSessionWithFallback,
  saveCandidate, saveResults, getAllCandidates
};