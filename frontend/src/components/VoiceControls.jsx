// Single button controlling the continuous SpeechRecognition session.
const VoiceControls = ({ isRecording, disabled, onToggle }) => (
  <button
    className={`voice-button ${isRecording ? 'stop' : 'start'}`}
    type="button"
    onClick={onToggle}
    disabled={disabled}
  >
    {isRecording ? 'Stop Recording' : 'Start Recording'}
  </button>
);

export default VoiceControls;


