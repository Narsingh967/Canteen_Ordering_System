const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config({ path: './config.env' });

const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const { autoCancelOrders } = require('./utils/autoCancel');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen-ordering')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Canteen Ordering System is running' });
});

cron.schedule('* * * * *', async () => {
  try {
    await autoCancelOrders();
    console.log('Auto-cancellation check completed');
  } catch (error) {
    console.error('Auto-cancellation error:', error);
  }
});
  
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 