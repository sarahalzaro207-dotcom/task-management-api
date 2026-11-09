const { matchedData } = require('express-validator');
const taskService = require('../services/task.service');

async function getTasks(req, res, next) {
  try {
    const query = matchedData(req, { locations: ['query'] });
    const { data, pagination } = await taskService.getAll(query);
    res.status(200).json({ success: true, data, pagination });
  } catch (err) {
    next(err);
  }
}//replaced gettasks with fun with the above

async function getTask(req, res, next) {
  try {
    const task = await taskService.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

//adding this fun here
async function getStats(req, res, next) {
  try {
    const stats = await taskService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}///////////////////////

async function createTask(req, res, next) {
  try {
    const task = await taskService.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await taskService.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const task = await taskService.update(req.params.id, { status: req.body.status });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const task = await taskService.remove(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, message: 'Task deleted', data: task });
  } catch (err) {
    next(err);
  }
}
module.exports = {
  getTasks,
  getStats,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
/*module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};*/
/*module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};*/
