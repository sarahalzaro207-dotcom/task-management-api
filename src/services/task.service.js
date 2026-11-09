const { v4: uuidv4 } = require('uuid');
const { readTasks, writeTasks, withLock } = require('../utils/file.utils');
//after replacing getAll fun 
async function getAll(query = {}) {
  let tasks = await readTasks();

  // 1. Filter
  if (query.status) tasks = tasks.filter((t) => t.status === query.status);
  if (query.priority) tasks = tasks.filter((t) => t.priority === query.priority);

  // 2. Search (case-insensitive, in title and description)
  if (query.search) {
    const term = query.search.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        (t.title || '').toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term)
    );
  }

  // 3. Sort
  const sortBy = query.sortBy || 'createdAt';
  const dir = query.order === 'desc' ? -1 : 1;

  tasks = [...tasks].sort((a, b) => {
    let x = a[sortBy];
    let y = b[sortBy];

    // Tasks without a dueDate always go last
    if (sortBy === 'dueDate') {
      if (!x && !y) return 0;
      if (!x) return 1;
      if (!y) return -1;
    }
    if (sortBy === 'priority') {
      x = PRIORITY_RANK[x];
      y = PRIORITY_RANK[y];
    }
    if (sortBy === 'title') {
      x = (x || '').toLowerCase();
      y = (y || '').toLowerCase();
    }

    if (x < y) return -1 * dir;
    if (x > y) return 1 * dir;
    return 0;
  });

  // 4. Paginate
  const page = query.page || 1;
  const limit = query.limit || 10;
  const totalItems = tasks.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const data = tasks.slice(start, start + limit);

  return { data, pagination: { page, limit, totalItems, totalPages } };
}
////////////replaced getAll function with the above code to add pagination, filtering, searching, and sorting features

async function getById(id) {
  const tasks = await readTasks();
  return tasks.find((t) => t.id === id) || null;
}

// Only these fields may be set by clients
const ALLOWED_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];
//*****
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };
//***** 
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
