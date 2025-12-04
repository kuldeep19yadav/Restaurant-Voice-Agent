import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const DEFAULT_CITY = import.meta.env.VITE_DEFAULT_CITY || 'New York';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

// Canonical order for the voice-driven booking flow.
const conversationSteps = [
  'GREETING',
  'ASK_GUESTS',
  'ASK_DATE',
  'ASK_TIME',
  'ASK_CUISINE',
  'ASK_SPECIAL',
  'WEATHER_CHECK',
  'SEATING_SUGGESTION',
  'CONFIRMATION',
  'SAVE',
  'COMPLETE',
];

const positiveKeywords = ['yes', 'yeah', 'confirm', 'sure', 'do it', 'please', 'absolutely'];
const negativeKeywords = ['no', 'not yet', 'hold', 'wait', 'stop', 'cancel'];

const initialFormState = {
  customerName: '',
  numberOfGuests: null,
  bookingDate: '',
  bookingTime: '',
  cuisinePreference: '',
  specialRequests: '',
  seatingPreference: '',
  weatherInfo: null,
  city: DEFAULT_CITY,
};

// Naive number extractor (sufficient for spoken responses like "we are four").
const parseGuests = (text) => {
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const sanitizeOrdinal = (text) => text.replace(/(\d+)(st|nd|rd|th)/gi, '$1');

// Accepts phrases like "December 20th" and ensures the date is in the future.
const parseDateInput = (text) => {
  const value = sanitizeOrdinal(text.trim());
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return null;
  }
  if (!parsed.startOf('day').isAfter(dayjs().startOf('day'))) {
    return null;
  }
  return parsed;
};

// Converts fuzzy time statements (e.g., "7 pm") into 24h HH:mm format.
const parseTimeInput = (text) => {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  let minute = match[2] ? Number(match[2]) : 0;
  const ampm = match[3] ? match[3].toLowerCase() : null;
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const formatDateForSpeech = (isoString) => dayjs(isoString).format('MMMM D, YYYY');

const seatingFromCategory = (category) => {
  if (category === 'sunny') return 'outdoor';
  if (category === 'cloudy') return 'either';
  return 'indoor';
};

const isAffirmative = (text) => positiveKeywords.some((word) => text.toLowerCase().includes(word));
const isNegative = (text) => negativeKeywords.some((word) => text.toLowerCase().includes(word));

/**
 * Central hook that owns the booking form data, conversation state machine,
 * weather lookups, and API persistence.
 */
const useConversationFlow = () => {
  const [state, setState] = useState(conversationSteps[0]);
  const [formData, setFormData] = useState(initialFormState);
  const [conversationLog, setConversationLog] = useState(() => [
    {
      sender: 'agent',
      text: 'Hello! I am your restaurant assistant. What is your name?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [agentMessage, setAgentMessage] = useState(
    'Hello! I am your restaurant assistant. What is your name?'
  );
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const appendMessage = useCallback((sender, text) => {
    setConversationLog((prev) => [
      ...prev,
      { sender, text, timestamp: new Date().toISOString() },
    ]);
    if (sender === 'agent') {
      setAgentMessage(text);
    }
  }, []);

  // Hydrates the sidebar list when the page loads.
  const fetchExistingBookings = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/bookings');
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings', err.message);
    }
  }, []);

  useEffect(() => {
    fetchExistingBookings();
  }, [fetchExistingBookings]);

  // Shells out to backend weather endpoint so suggestions stay server-trusted.
  const fetchWeatherPreview = useCallback(
    async (date) => {
      try {
        const { data } = await axiosInstance.get('/api/weather', {
          params: { date, city: formData.city },
        });
        return data;
      } catch (err) {
        console.error('Weather lookup failed', err);
        throw new Error('Unable to fetch weather right now.');
      }
    },
    [formData.city]
  );

  // Posts the completed booking to the backend and surfaces the success speech.
  const handleSave = useCallback(async () => {
    if (!formData.bookingDate || !weatherInfo) {
      return 'I need the date and weather before I can save the booking.';
    }

    setIsSaving(true);
    setState('SAVE');
    try {
      const payload = {
        customerName: formData.customerName,
        numberOfGuests: formData.numberOfGuests,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        cuisinePreference: formData.cuisinePreference,
        specialRequests: formData.specialRequests || 'None',
        seatingPreference: formData.seatingPreference,
        weatherInfo,
        status: 'confirmed',
      };

      const { data } = await axiosInstance.post('/api/bookings', payload);
      setBookings((prev) => [data, ...prev]);
      setState('COMPLETE');
      return `You're all set! Booking ${data.bookingId} is confirmed for ${formatDateForSpeech(
        formData.bookingDate
      )} at ${formData.bookingTime}. Enjoy your meal!`;
    } catch (err) {
      console.error('Booking save failed', err);
      setState('CONFIRMATION');
      return 'Hmm, I could not save the booking. Can we try again?';
    } finally {
      setIsSaving(false);
    }
  }, [formData, weatherInfo]);

  // Triggers weather lookup and seating recommendation once form data is ready.
  const handleWeatherAndSuggestion = useCallback(async () => {
    if (!formData.bookingDate) {
      setState('ASK_DATE');
      return 'I still need the booking date before fetching the weather.';
    }
    setState('WEATHER_CHECK');
    try {
      const weather = await fetchWeatherPreview(formData.bookingDate);
      setWeatherInfo(weather);
      setError(null);
      const seatingChoice = seatingFromCategory(weather.category);
      setFormData((prev) => ({
        ...prev,
        weatherInfo: weather,
        seatingPreference: seatingChoice,
      }));
      setState('SEATING_SUGGESTION');
      const weatherLine = `Weather for ${formatDateForSpeech(
        formData.bookingDate
      )} in ${weather.city} looks ${weather.summary || weather.category} with temperatures around ${
        weather.temperatureC ?? 'comfortable'
      }°C.`;
      const seatingLine =
        seatingChoice === 'either'
          ? 'Conditions are flexible, so we can seat you indoors or outdoors.'
          : `I recommend our ${seatingChoice} area for the best experience.`;
      setState('CONFIRMATION');
      return `${weatherLine} ${seatingLine} Shall I confirm all of these details?`;
    } catch (err) {
      setError(err.message);
      setState('CONFIRMATION');
      return 'I could not retrieve the weather. Would you still like me to confirm the booking?';
    }
  }, [fetchWeatherPreview, formData.bookingDate]);

  // Deterministic state machine deciding what the agent should ask next.
  const processState = useCallback(
    async (input) => {
      switch (state) {
        case 'GREETING': {
          setFormData((prev) => ({ ...prev, customerName: input }));
          setState('ASK_GUESTS');
          return `Great to meet you, ${input}! How many guests are joining?`;
        }
        case 'ASK_GUESTS': {
          const guests = parseGuests(input);
          if (!guests) {
            return 'I did not catch the guest count. How many people are in your party?';
          }
          setFormData((prev) => ({ ...prev, numberOfGuests: guests }));
          setState('ASK_DATE');
          return 'Perfect. Which date should I book for you?';
        }
        case 'ASK_DATE': {
          const parsedDate = parseDateInput(input);
          if (!parsedDate) {
            return 'Please share a future date, like December 12th.';
          }
          setFormData((prev) => ({ ...prev, bookingDate: parsedDate.format('YYYY-MM-DD') }));
          setState('ASK_TIME');
          return 'Thanks! What time would you like?';
        }
        case 'ASK_TIME': {
          const time = parseTimeInput(input);
          if (!time) {
            return 'Could you provide a specific time, such as 7:30 PM?';
          }
          setFormData((prev) => ({ ...prev, bookingTime: time }));
          setState('ASK_CUISINE');
          return 'Got it. Any cuisine preference for this reservation?';
        }
        case 'ASK_CUISINE': {
          setFormData((prev) => ({ ...prev, cuisinePreference: input }));
          setState('ASK_SPECIAL');
          return 'Noted. Do you have any special requests or dietary needs? You can say none.';
        }
        case 'ASK_SPECIAL': {
          const specialText = input.toLowerCase().includes('none') ? 'None' : input;
          setFormData((prev) => ({ ...prev, specialRequests: specialText }));
          return handleWeatherAndSuggestion();
        }
        case 'CONFIRMATION': {
          if (isAffirmative(input)) {
            return handleSave();
          }
          if (isNegative(input)) {
            return 'No problem. Let me know what you would like to change.';
          }
          return 'Just to confirm, should I lock in this reservation?';
        }
        case 'COMPLETE':
          return 'Your reservation is already confirmed. Say restart if you need another booking.';
        default:
          return 'Let me know how else I can help.';
      }
    },
    [handleSave, handleWeatherAndSuggestion, state]
  );

  // Resets everything so a new reservation can start cleanly.
  const resetConversation = useCallback(() => {
    setFormData(initialFormState);
    setState('GREETING');
    setWeatherInfo(null);
    setError(null);
    setConversationLog([
      {
        sender: 'agent',
        text: 'Hello! I am your restaurant assistant. What is your name?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setAgentMessage('Hello! I am your restaurant assistant. What is your name?');
  }, []);

  // Entry point invoked by the speech layer with final transcripts.
  const handleUserInput = useCallback(
    async (text) => {
      const cleaned = text.trim();
      if (!cleaned) {
        const fallback = 'Could you repeat that for me?';
        appendMessage('agent', fallback);
        return fallback;
      }

      if (cleaned.toLowerCase().includes('restart')) {
        resetConversation();
        const restartReply = 'Restarting the flow. What is your name?';
        appendMessage('agent', restartReply);
        return restartReply;
      }

      appendMessage('user', cleaned);
      const reply = await processState(cleaned);
      appendMessage('agent', reply);
      return reply;
    },
    [appendMessage, processState, resetConversation]
  );

  return {
    state,
    agentMessage,
    conversationLog,
    handleUserInput,
    resetConversation,
    weatherInfo,
    seatingPreference: formData.seatingPreference,
    formData,
    bookings,
    isSaving,
    error,
    fetchExistingBookings,
  };
};

export default useConversationFlow;

