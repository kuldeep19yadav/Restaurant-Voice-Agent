const express = require('express');
const {
  createBooking,
  getBookings,
  getBookingById,
  deleteBooking,
} = require('../controllers/bookingController');

const router = express.Router();

// Booking CRUD endpoints consumed by the React frontend.
router.post('/', createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.delete('/:id', deleteBooking);

module.exports = router;


