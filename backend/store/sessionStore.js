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

module.exports = { createSession, getSession, setSession, updateSession, deleteSession };