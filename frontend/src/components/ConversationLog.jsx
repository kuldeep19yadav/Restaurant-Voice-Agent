const ConversationLog = ({ messages }) => (
  <div className="conversation-log">
    <h3>Conversation</h3>
    <div className="conversation-messages">
      {messages.map((entry, index) => (
        <div key={`${entry.timestamp}-${entry.sender}-${index}`} className={`message ${entry.sender}`}>
          <span className="sender-label">{entry.sender === 'agent' ? 'Agent' : 'You'}</span>
          <p>{entry.text}</p>
        </div>
      ))}
    </div>
  </div>
);

export default ConversationLog;

