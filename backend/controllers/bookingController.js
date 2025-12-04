const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const { validateBookingInput } = require('../utils/validation');
const { getWeatherForDate, seatingFromCategory } = require('../services/weatherService');

/**
 * Handles POST /api/bookings
 * Validates payload, enriches with weather + seating suggestion, saves to Mongo.
 */
const createBooking = async (req, res, next) => {
  try {
    const { errors, payload } = validateBookingInput(req.body);

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const weatherInfo = await getWeatherForDate(payload.bookingDate, payload.city);
    const seatingPreference = seatingFromCategory(weatherInfo.category);

    const bookingToCreate = {
      bookingId: uuidv4(),
      customerName: payload.customerName,
      numberOfGuests: payload.numberOfGuests,
      bookingDate: payload.bookingDate,
      bookingTime: payload.bookingTime,
      cuisinePreference: payload.cuisinePreference,
      specialRequests: payload.specialRequests,
      weatherInfo,
      seatingPreference,
      status: payload.status || 'confirmed',
    };

    const created = await Booking.create(bookingToCreate);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

// Returns newest bookings first for the dashboard view.
const getBookings = async (_req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// Soft requirements allow DELETE to fully remove the document.
const deleteBooking = async (req, res, next) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  deleteBooking,
};


