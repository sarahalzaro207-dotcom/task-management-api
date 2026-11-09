const express = require('express');
const controller = require('../controllers/task.controller');
const {
  validateCreate,
  validateUpdate,
  validateStatus,
  validateListQuery,
} = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/', validateListQuery, controller.getTasks);
router.post('/', validateCreate, controller.createTask);
router.get('/:id', controller.getTask);
router.put('/:id', validateUpdate, controller.updateTask);
router.patch('/:id/status', validateStatus, controller.updateTaskStatus);
router.delete('/:id', controller.deleteTask);

module.exports = router;