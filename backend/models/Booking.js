const mongoose = require('mongoose');

const weatherInfoSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    summary: String,
    rawCondition: String,
    temperatureC: Number,
    humidity: Number,
    windKph: Number,
    city: String,
    timestamp: Date,
    source: String,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true, trim: true },
  numberOfGuests: { type: Number, required: true, min: 1 },
  bookingDate: { type: Date, required: true },
  bookingTime: { type: String, required: true },
  cuisinePreference: { type: String, required: true },
  specialRequests: { type: String, default: '' },
  weatherInfo: { type: weatherInfoSchema, required: true },
  seatingPreference: { type: String, required: true },
  status: { type: String, default: 'confirmed' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);

