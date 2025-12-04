import dayjs from 'dayjs';

// Renders the persisted bookings pulled from the backend API.
const BookingList = ({ bookings }) => (
  <div className="booking-list">
    <h3>Saved Bookings</h3>
    {bookings.length === 0 ? (
      <p>No bookings saved yet.</p>
    ) : (
      <ul>
        {bookings.map((booking) => (
          <li key={booking._id || booking.bookingId}>
            <div className="booking-row">
              <strong>{booking.customerName}</strong>
              <span>
                {dayjs(booking.bookingDate).format('MMM D, YYYY')} @ {booking.bookingTime}
              </span>
              <span className="badge">{booking.seatingPreference}</span>
            </div>
            <p>{booking.cuisinePreference} • {booking.numberOfGuests} guests</p>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default BookingList;

