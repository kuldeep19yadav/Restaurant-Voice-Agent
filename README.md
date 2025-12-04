# Restaurant Booking Voice Agent

Voice-first MERN application that lets guests reserve a table purely through natural speech. The assistant guides users through every reservation step, looks up live weather via OpenWeatherMap, suggests the best seating, and stores confirmed bookings in MongoDB.

## Project Structure

```
project/
├── backend/      # Node + Express + MongoDB API
├── frontend/     # React voice interface (Vite)
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or Atlas)
- OpenWeatherMap API key

## Environment Variables

Copy the provided examples and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend (`backend/.env`)

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant-voice-agent
MONGO_DB_NAME=restaurant_voice_agent
OPENWEATHER_API_KEY=your_openweather_api_key
DEFAULT_CITY=New York
```

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:5000
VITE_DEFAULT_CITY=New York
```

## Backend

```bash
cd backend
npm install
npm run dev
```

The API exposes:

| Method | Route              | Description          |
| ------ | ------------------ | -------------------- |
| POST   | `/api/bookings`    | Save a new booking   |
| GET    | `/api/bookings`    | List all bookings    |
| GET    | `/api/bookings/:id`| Fetch booking by id  |
| DELETE | `/api/bookings/:id`| Delete a booking     |
| GET    | `/api/weather`     | Fetch weather summary|

Validation rules:

- All booking fields are required except `specialRequests`
- `bookingDate` must be a future date
- `numberOfGuests` must be greater than zero

## Frontend

```bash
cd frontend
npm install
npm start
```

Key UI elements:

- Start/Stop voice recording button powered by the Web Speech API
- Live speech transcript and agent response areas
- Conversation log plus current weather + seating suggestion card
- Recent bookings list pulled from the backend

## Weather Integration

- Frontend calls `GET /api/weather?date=YYYY-MM-DD&city=City`
- Backend uses OpenWeatherMap (forecast + fallback) and maps responses to categories: `sunny`, `rainy`, `cloudy`, `thunderstorm`
- Seating suggestions are derived automatically:
  - sunny → outdoor
  - cloudy → either indoor or outdoor
  - rainy/thunderstorm → indoor

## Testing Tips

- Use Chrome or Edge for full Web Speech API support
- Ensure MongoDB is running before hitting the booking API
- Observe backend logs for weather/lookups and database events

Enjoy building reservations hands-free!


