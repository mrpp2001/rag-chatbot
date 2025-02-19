import React from 'react'

const LoadingBubble = () => {
  return (
    <div className="bubble-container">
      <div className="bubble ai loading-bubble">
        <div className="loading-dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  )
}

export default LoadingBubble