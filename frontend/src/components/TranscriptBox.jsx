// Displays either the user transcript or latest agent response.
const TranscriptBox = ({ title, content }) => (
  <div className="transcript-box">
    <h3>{title}</h3>
    <div className="transcript-content">{content || 'Waiting for speech...'}</div>
  </div>
);

export default TranscriptBox;


