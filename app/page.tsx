"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";

const Home = () => {
  const {
    input,
    append,
    isLoading,
    messages,
    handleInputChange,
    handleSubmit,
  } = useChat();

  const noMessages = !messages || messages.length === 0;

  const handlePromt = (promptText: string) => {
    append({
      role: "user",
      content: promptText,
    } as Message);
  };

  return (
    <main>
      <p>F1 GPT</p>
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-test">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab totam
              tempora maiores nobis cupiditate numquam praesentium cum. Est
              fugiat officia totam explicabo earum molestias ad aliquid
              laudantium velit officiis. Quaerat!
            </p>
            <br />
            <PromptSuggestionsRow onClick={handlePromt} />
          </>
        ) : (
          <>
            {messages.map((messages, index) => {
              return (
                <Bubble
                  key={`message-${index}`}
                  message={messages.content}
                  isUser={false}
                  timestamp="10:30 AM"
                />
              );
            })}

            <LoadingBubble />
          </>
        )}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something"
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;
