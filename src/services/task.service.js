const { v4: uuidv4 } = require('uuid');
const { readTasks, writeTasks, withLock } = require('../utils/file.utils');

async function getAll() {
  return readTasks();
}

async function getById(id) {
  const tasks = await readTasks();
  return tasks.find((t) => t.id === id) || null;
}

// Only these fields may be set by clients
const ALLOWED_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

function pickAllowed(data) {
  const result = {};
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) result[key] = data[key];
  }
  return result;
}

async function create(data) {
  return withLock(async () => {
    const tasks = await readTasks();
    const now = new Date().toISOString();

    const task = {
      status: 'pending',
      priority: 'medium',
      ...pickAllowed(data),
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(task);
    await writeTasks(tasks);
    return task;
  });
}

async function update(id, data) {
  return withLock(async () => {
    const tasks = await readTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const old = tasks[index];
    const updated = {
      ...old,
      ...pickAllowed(data),
      id: old.id,
      createdAt: old.createdAt,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updated;
    await writeTasks(tasks);
    return updated;
  });
}

async function remove(id) {
  return withLock(async () => {
    const tasks = await readTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const [deleted] = tasks.splice(index, 1);
    await writeTasks(tasks);
    return deleted;
  });
}

module.exports = { getAll, getById, create, update, remove };
//module.exports = { getAll, getById, create };
//module.exports = { getAll, getById };
