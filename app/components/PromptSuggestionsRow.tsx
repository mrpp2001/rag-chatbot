import React from 'react'

interface PromptSuggestionsRowProps {
  onClick: (suggestion: string) => void
}

const PromptSuggestionsRow: React.FC<PromptSuggestionsRowProps> = ({ onClick }) => {
  const f1Suggestions = [
    "Who won the latest F1 championship?",
    "Explain F1 race strategy",
    "Top F1 drivers of all time",
    "How does DRS work in F1?"
  ]

  return (
    <div className="suggestions-row">
      {f1Suggestions.map((suggestion, index) => (
        <button
          key={`suggestions-${index}`}
          className="suggestion-button"
          onClick={() => onClick(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

export default PromptSuggestionsRow