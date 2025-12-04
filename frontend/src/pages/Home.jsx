import { useCallback, useEffect, useRef, useState } from 'react';
import useConversationFlow from '../hooks/useConversationFlow';
import VoiceControls from '../components/VoiceControls';
import TranscriptBox from '../components/TranscriptBox';
import ConversationLog from '../components/ConversationLog';
import BookingList from '../components/BookingList';

const Home = () => {
  const {
    state,
    agentMessage,
    conversationLog,
    handleUserInput,
    weatherInfo,
    seatingPreference,
    bookings,
    error,
    resetConversation,
  } = useConversationFlow();

  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Single speech-synthesis helper so every agent response is voiced.
  const speak = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  // Final transcripts drive the conversation hook; interim text populates UI.
  const handleFinalTranscript = useCallback(
    async (text) => {
      const reply = await handleUserInput(text);
      speak(reply);
      setTranscript('');
    },
    [handleUserInput, speak]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        handleFinalTranscript(finalTranscript);
      } else {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = () => {
      isRecordingRef.current = false;
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    speak('Hello! I am your restaurant assistant. What is your name?');

    return () => {
      isRecordingRef.current = false;
      recognition.stop();
    };
  }, [handleFinalTranscript, speak]);

  // Simple toggle to start/stop continuous recognition.
  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      isRecordingRef.current = true;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Reset clears recognition state + conversation progress.
  const handleReset = () => {
    if (isRecordingRef.current && recognitionRef.current) {
      isRecordingRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    resetConversation();
    speak('Starting a new reservation. What is your name?');
  };

  return (
    <main className="app-container">
      <header>
        <h1>Restaurant Booking Voice Agent</h1>
        <p>
          Current step: <strong>{state}</strong>
        </p>
      </header>

      {!speechSupported && (
        <div className="warning">
          Your browser does not support the Web Speech API. Please try Chrome or Edge.
        </div>
      )}

      <section className="controls">
        <VoiceControls
          isRecording={isRecording}
          disabled={!speechSupported}
          onToggle={toggleRecording}
        />
        {isRecording && <span className="recording-indicator">Listening...</span>}
        <button type="button" className="reset-button" onClick={handleReset}>
          Reset
        </button>
      </section>

      <section className="transcripts">
        <TranscriptBox title="You" content={transcript} />
        <TranscriptBox title="Agent" content={agentMessage} />
      </section>

      {error && <div className="error-banner">{error}</div>}

      <ConversationLog messages={conversationLog} />

      {weatherInfo && (
        <div className="weather-card">
          <h3>Weather Insight</h3>
          <p>
            {weatherInfo.city}: {weatherInfo.summary || weatherInfo.category} (
            {weatherInfo.temperatureC ?? 'n/a'}°C)
          </p>
          <p>Suggested seating: {seatingPreference}</p>
        </div>
      )}

      <BookingList bookings={bookings} />
    </main>
  );
};

export default Home;

