const express = require('express');
const {
  createBooking,
  getBookings,
  getBookingById,
  deleteBooking,
} = require('../controllers/bookingController');

const router = express.Router();

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.delete('/:id', deleteBooking);

module.exports = router;


