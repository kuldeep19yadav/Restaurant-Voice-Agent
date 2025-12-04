const dayjs = require('dayjs');

// Ensures the provided date is valid and strictly in the future.
const isFutureDate = (dateValue) => {
  const parsed = dayjs(dateValue);
  if (!parsed.isValid()) {
    return false;
  }
  return parsed.startOf('day').isAfter(dayjs().startOf('day'));
};

const sanitizeTime = (timeValue = '') => timeValue.trim();

/**
 * Normalizes + validates incoming booking payloads.
 * Returns both accumulated errors and sanitized values.
 */
const validateBookingInput = (payload = {}) => {
  const errors = [];

  const customerName = (payload.customerName || '').trim();
  if (!customerName) {
    errors.push('Customer name is required.');
  }

  const numberOfGuests = Number(payload.numberOfGuests);
  if (!Number.isFinite(numberOfGuests) || numberOfGuests <= 0) {
    errors.push('numberOfGuests must be a number greater than zero.');
  }

  const bookingDate = payload.bookingDate ? dayjs(payload.bookingDate) : null;
  if (!bookingDate || !bookingDate.isValid()) {
    errors.push('bookingDate must be a valid date.');
  } else if (!isFutureDate(bookingDate)) {
    errors.push('bookingDate must be in the future.');
  }

  const bookingTime = sanitizeTime(payload.bookingTime || '');
  if (!bookingTime) {
    errors.push('bookingTime is required.');
  }

  const cuisinePreference = (payload.cuisinePreference || '').trim();
  if (!cuisinePreference) {
    errors.push('cuisinePreference is required.');
  }

  const specialRequests = (payload.specialRequests || '').trim();
  const city = (payload.city || process.env.DEFAULT_CITY || 'New York').trim();

  return {
    errors,
    payload: {
      customerName,
      numberOfGuests,
      bookingDate: bookingDate ? bookingDate.toDate() : null,
      bookingTime,
      cuisinePreference,
      specialRequests,
      city,
      status: payload.status,
    },
  };
};

module.exports = {
  validateBookingInput,
};

