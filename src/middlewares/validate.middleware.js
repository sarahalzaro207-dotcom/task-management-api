//const { body, validationResult } = require('express-validator');
const { body, query, validationResult } = require('express-validator');

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];
const SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'title'];

// Runs after the rules: returns 400 if any rule failed
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

// Must be YYYY-MM-DD and a real calendar date (rejects 2026-02-30)
function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Makes sure the body is a JSON object
function requireObjectBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Request body must be a JSON object',
    });
  }
  return next();
}

// Rejects an update whose body has none of the allowed fields
function requireNonEmptyBody(req, res, next) {
  const fields = ['title', 'description', 'status', 'priority', 'dueDate'];
  const hasField = fields.some((f) => req.body[f] !== undefined);
  if (!hasField) {
    return res.status(400).json({
      success: false,
      message: `Request body must include at least one of: ${fields.join(', ')}`,
    });
  }
  return next();
}

// Rules for each field. For updates, every field is optional.
function fieldRules(optional) {
  const title = optional ? body('title').optional() : body('title');

  return [
    title
      .isString().withMessage('title must be a string')
      .bail()
      .trim()
      .isLength({ min: 1, max: 120 })
      .withMessage('title must be between 1 and 120 characters'),

    body('description')
      .optional()
      .isString().withMessage('description must be a string')
      .bail()
      .isLength({ max: 1000 })
      .withMessage('description must be at most 1000 characters'),

    body('status')
      .optional()
      .isIn(STATUSES)
      .withMessage(`status must be one of: ${STATUSES.join(', ')}`),

    body('priority')
      .optional()
      .isIn(PRIORITIES)
      .withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`),

    body('dueDate')
      .optional()
      .custom(isRealDate)
      .withMessage('dueDate must be a valid date in YYYY-MM-DD format'),
  ];
}

const validateCreate = [requireObjectBody, ...fieldRules(false), handleValidation];

const validateUpdate = [
  requireObjectBody,
  requireNonEmptyBody,
  ...fieldRules(true),
  handleValidation,
];

const validateStatus = [
  requireObjectBody,
  body('status')
    .exists().withMessage('status is required')
    .bail()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  handleValidation,
];

const validateListQuery = [
  query('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(', ')}`),

  query('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`),

  query('search')
    .optional()
    .isString().withMessage('search must be text')
    .trim(),

  query('sortBy')
    .optional()
    .isIn(SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${SORT_FIELDS.join(', ')}`),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order must be asc or desc'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be an integer of 1 or more')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100')
    .toInt(),

  handleValidation,
];

//module.exports = { validateCreate, validateUpdate, validateStatus };
module.exports = { validateCreate, validateUpdate, validateStatus, validateListQuery };