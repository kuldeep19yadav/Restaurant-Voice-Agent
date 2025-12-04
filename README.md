# Restaurant Voice Agent 🎤🍽️

> **⚠️ Development Status Note:** 
> This project is currently in development phase. Functionality implementation, comprehensive testing and optimization are pending.


# Restaurant Booking Voice Agent

Voice-first MERN application that lets guests reserve a table purely through natural speech. The assistant guides users through every reservation step, looks up live weather via OpenWeatherMap, suggests the best seating, and stores confirmed bookings in MongoDB.

## Approach

- **Voice-first UX** – Web Speech API handles both continuous speech recognition and TTS replies so users never need to type during the booking workflow.
- **Deterministic conversation flow** – A finite-state machine progresses through greeting → guest count → date/time → cuisine → special requests → weather lookup → confirmation → save.
- **Validation-first backend** – Every booking is validated (future date, guests > 0, required fields) before hitting MongoDB to keep data clean.
- **Real weather-driven seating** – Backend talks to OpenWeatherMap in real time, normalizes conditions into sunny/rainy/cloudy/thunderstorm, then recommends indoor/outdoor/either seating.
- **Audit-friendly storage** – Each saved booking includes weather snapshot, seating suggestion, and generated bookingId so the history is traceable.

## Architecture
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Voice    │────▶│  Speech-to-Text │────▶│   Intent       │
│    Input        │    │   (Frontend)    │    │  Recognition   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Voice Response │◀───│   Backend API   │◀───│  Booking Logic │
│  (Text-to-Speech)│    │   (Express.js)  │    │   & Database   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User          │    │   Restaurant    │    │   MongoDB      │
│   Interface     │    │   Management    │    │   Atlas Cloud  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```
Browser (React + Web Speech)
  ├─ VoiceControls (SpeechRecognition + speechSynthesis)
  ├─ Conversation hook (state machine + axios API client)
  ├─ UI components (transcripts, log, weather card, booking list)
  ↓ REST API calls
Express API (Node.js)
  ├─ Routes: /api/bookings, /api/weather
  ├─ Controllers + validation utilities
  ├─ Weather service (OpenWeatherMap)
  └─ MongoDB via Mongoose (Booking model)
External services
  ├─ MongoDB (Atlas/local)
  └─ OpenWeatherMap (forecast + fallback to current)
```

- **Data flow:** Browser captures speech → conversation hook updates state → POSTs booking to `/api/bookings`. Backend validates, fetches weather, saves to MongoDB, and returns the persisted record for the UI list.
- **Separation of concerns:** Voice UX lives entirely in the frontend; backend focuses on validation, persistence, and third-party integrations.

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

## Installation

1. **Clone & enter the project**
   ```bash
   git clone https://github.com/<your-username>/restaurant-voice-agent.git
   cd restaurant-voice-agent
   ```
2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # edit both .env files with your MongoDB URI + OpenWeatherMap key
   ```
3. **Install & run backend**
   ```bash
   cd backend
   npm install
   npm run dev            # starts API on http://localhost:5000
   ```
4. **Install & run frontend (new terminal)**
   ```bash
   cd frontend
   npm install
   npm start              # serves React app on http://localhost:5173
   ```
5. **Open the app** – Visit `http://localhost:5173`, click **Start Recording**, and converse with the agent. Keep the backend terminal running for API + weather lookups.

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



