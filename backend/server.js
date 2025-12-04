const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const bookingRoutes = require('./routes/bookingRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.json({ message: 'Restaurant Booking Voice Agent API is running' });
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/weather', weatherRoutes);

app.use((err, req, res, next) => {
  console.error('[API ERROR]', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });

