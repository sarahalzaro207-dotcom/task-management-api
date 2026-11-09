const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const taskRoutes = require('./routes/task.routes');   // <- must be here
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

app.use('/api/tasks', taskRoutes);                     // <- must be here

app.use(notFound);
app.use(errorHandler);

module.exports = app;                                  // <- and this stays LAST