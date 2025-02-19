import React from 'react'

interface BubbleProps {
  message?: string
  isUser?: boolean
  timestamp?: string
}

const Bubble: React.FC<BubbleProps> = ({ message, isUser = false, timestamp }) => {
  return (
    <div className={`bubble-container ${isUser ? 'user' : ''}`}>
      <div className={`bubble ${isUser ? 'user' : 'ai'}`}>
        <div>{message}</div>
        {timestamp && <div className="timestamp">{timestamp}</div>}
      </div>
    </div>
  )
}

export default Bubble