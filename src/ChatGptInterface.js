import React, { useState, useRef, useEffect, Fragment } from "react";
import "./index.css";

const host = "http://localhost:8080";
const temperature = 0.7;

const ChatGptInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState("");
  const chatContainerRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async () => {
    // Add user input to messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: input },
    ]);

    // Reset error state and set loading state
    setError(null);
    setIsLoading(true);

    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...messages,
            {
              role: "user",
              content: input,
            },
          ],
          temperature,
          stream: true,
        }),
      };

      const response = await fetch(`${host}/v1/chat/completions`, requestOptions);

      let data = "";
      const reader = response.body.getReader();
      let partialData = "";
      let done = false;
      let assistantResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();

        done = readerDone;

        if (value) {
          const chunk = new TextDecoder().decode(value);
          partialData += chunk;
          const lines = partialData.split("\n");

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.startsWith("data: ")) {
              const jsonStr = line.substring("data: ".length);
              const json = JSON.parse(jsonStr);

              // Check if the response contains choices and delta fields
              if (json.choices && json.choices.length > 0 && json.choices[0].delta) {
                const token = json.choices[0].delta.content;
                if (token !== undefined) {
                  assistantResponse += token;
                  setCurrentAssistantMessage(assistantResponse);
                }
              }
            }
          }

          partialData = lines[lines.length - 1];
        }
      }

      // Add assistant response to messages
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: assistantResponse },
      ]);

      // Clear input field and currentAssistantMessage
      setInput("");
      setCurrentAssistantMessage("");
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to fetch response. Please try again: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${host}/v1/models`);
        const data = await response.json();
        setModels(data?.data || []);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchModels();
  }, []);

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentAssistantMessage]);

  const renderMessageContent = (content) => {
    const parts = content.split("\n");
    return parts.map((part, index) => (
      <Fragment key={index}>
        {part}
        {index < parts.length - 1 && <br />}
      </Fragment>
    ));
  };

  return (
    <div className="chat-page">
      {/* Render dropdown list for models */}
      <div className="model-dropdown">
        <select
          value={selectedModel}
          onChange={handleModelChange}
          disabled={isLoading}
        >
          <option value="">Select Model</option>
          {models.map((model, index) => (
            <option key={index} value={model.id}>
              {model.id}
            </option>
          ))}
        </select>
      </div>
      <div className="chat-container" ref={chatContainerRef}>
        <div className="chat-messages">
          {/* Render user input and chatbot responses */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${
                message.role === "user" ? "user-message" : "assistant-message"
              }`}
            >
              <span className="message-role">
                {message.role === "user" ? "You" : "LocalAI"}:
              </span>
              <span className="message-content">
                {renderMessageContent(message.content)}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant-message">
              <span className="message-role">LocalAI:</span>
              <span className="message-content">
                {renderMessageContent(currentAssistantMessage)}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="chat-input">
        {/* Render input field and submit button */}
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="input-field"
          placeholder="Enter your message..."
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          className="submit-button"
          disabled={!input || isLoading}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </div>
      {/* Render error message if there's an error */}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ChatGptInterface;
