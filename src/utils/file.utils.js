const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Create the data folder and tasks.json if they are missing
async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TASKS_FILE);
  } catch {
    await fs.writeFile(TASKS_FILE, '[]', 'utf8');
  }
}

// Read all tasks. Never overwrites the file if reading or parsing fails.
async function readTasks() {
  await ensureFile();
  const raw = await fs.readFile(TASKS_FILE, 'utf8');

  if (raw.trim() === '') return [];

  try {
    const tasks = JSON.parse(raw);
    if (!Array.isArray(tasks)) {
      throw new Error('tasks.json must contain an array');
    }
    return tasks;
  } catch (err) {
    throw new Error('Storage error: tasks.json contains invalid JSON');
  }
}

// Write all tasks with readable indentation
async function writeTasks(tasks) {
  await ensureFile();
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

// Simple queue: runs one operation at a time so overlapping
// requests cannot overwrite each other's changes
let queue = Promise.resolve();

function withLock(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {}); // keep the queue alive after errors
  return run;
}

module.exports = { ensureFile, readTasks, writeTasks, withLock };