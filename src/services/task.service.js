const { v4: uuidv4 } = require('uuid');
const pool = require('../utils/db');

// Only these fields may be set by clients
const ALLOWED_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

function pickAllowed(data) {
  const result = {};
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) result[key] = data[key];
  }
  return result;
}

// "2026-11-16 09:20:00.123" (from MySQL) -> "2026-11-16T09:20:00.123Z"
function toIso(sqlDate) {
  return new Date(sqlDate.replace(' ', 'T') + 'Z').toISOString();
}

// "2026-11-16T09:20:00.123Z" -> "2026-11-16 09:20:00.123" (for MySQL)
function toSql(iso) {
  return iso.replace('T', ' ').replace('Z', '');
}

// Turn a database row into the same task object the API always returned
function toTask(row) {
  const task = {
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
  if (row.description !== null) task.description = row.description;
  if (row.due_date !== null) task.dueDate = row.due_date;
  return task;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return rows.length ? toTask(rows[0]) : null;
}

async function create(data) {
  const input = pickAllowed(data);
  const id = uuidv4();
  const now = toSql(new Date().toISOString());

  await pool.query(
    `INSERT INTO tasks
       (id, title, description, status, priority, due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.description ?? null,
      input.status ?? 'pending',
      input.priority ?? 'medium',
      input.dueDate ?? null,
      now,
      now,
    ]
  );

  return getById(id);
}

async function update(id, data) {
  const input = pickAllowed(data);

  // API field name -> database column name (a fixed list, never user input)
  const columns = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    dueDate: 'due_date',
  };

  const sets = [];
  const values = [];
  for (const [field, column] of Object.entries(columns)) {
    if (input[field] !== undefined) {
      sets.push(`${column} = ?`);
      values.push(input[field]);
    }
  }

  // updatedAt always changes; id and createdAt are never touched
  sets.push('updated_at = ?');
  values.push(toSql(new Date().toISOString()));
  values.push(id);

  const [result] = await pool.query(
    `UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
  if (result.affectedRows === 0) return null;
  return getById(id);
}

async function remove(id) {
  const task = await getById(id);
  if (!task) return null;
  await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return task;
}

// API sort names -> safe SQL (a fixed list, never user input)
function buildOrder(sortBy, order) {
  const dir = order === 'desc' ? 'DESC' : 'ASC';
  switch (sortBy) {
    case 'priority':
      return `priority ${dir}`; // ENUM sorts low < medium < high
    case 'dueDate':
      return `due_date IS NULL, due_date ${dir}`; // tasks without a date last
    case 'title':
      return `LOWER(title) ${dir}`;
    default:
      return `created_at ${dir}`;
  }
}

async function getAll(query = {}) {
  const where = [];
  const values = [];

  // 1. Filter
  if (query.status) {
    where.push('status = ?');
    values.push(query.status);
  }
  if (query.priority) {
    where.push('priority = ?');
    values.push(query.priority);
  }

  // 2. Search (case-insensitive, title and description)
  if (query.search) {
    const escaped = query.search.toLowerCase().replace(/[\\%_]/g, '\\$&');
    const term = `%${escaped}%`;
    where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)');
    values.push(term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // 3. Sort
  const orderSql = buildOrder(query.sortBy || 'createdAt', query.order);

  // 4. Paginate
  const page = query.page || 1;
  const limit = query.limit || 10;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tasks ${whereSql}`,
    values
  );

  const [rows] = await pool.query(
    `SELECT * FROM tasks ${whereSql} ORDER BY ${orderSql}, created_at ASC LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit]
  );

  return {
    data: rows.map(toTask),
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getStats() {
  const stats = {
    total: 0,
    byStatus: { pending: 0, 'in-progress': 0, completed: 0 },
    byPriority: { low: 0, medium: 0, high: 0 },
  };

  const [byStatus] = await pool.query(
    'SELECT status, COUNT(*) AS n FROM tasks GROUP BY status'
  );
  for (const row of byStatus) {
    stats.byStatus[row.status] = row.n;
    stats.total += row.n;
  }

  const [byPriority] = await pool.query(
    'SELECT priority, COUNT(*) AS n FROM tasks GROUP BY priority'
  );
  for (const row of byPriority) {
    stats.byPriority[row.priority] = row.n;
  }

  return stats;
}

//module.exports = { getById, create };
//module.exports = { getById, create, update, remove };
//module.exports = { getAll, getById, create, update, remove };
module.exports = { getAll, getById, create, update, remove, getStats };
