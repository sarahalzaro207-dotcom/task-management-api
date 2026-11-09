const express = require('express');
const controller = require('../controllers/task.controller');

const router = express.Router();

router.get('/', controller.getTasks);
router.post('/', controller.createTask);
router.get('/:id', controller.getTask);
router.put('/:id', controller.updateTask);
router.patch('/:id/status', controller.updateTaskStatus);
router.delete('/:id', controller.deleteTask);

module.exports = router;
