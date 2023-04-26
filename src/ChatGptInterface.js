import React, { useState, useRef, useEffect } from "react";
import "./App.css"; // Import custom CSS for styling

const ChatGptInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]); // Added state for models
  const chatContainerRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

const handleSubmit = async () => {
  // Reset error state and set loading state
  setError(null);
  setIsLoading(true);

  try {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel, // Use selectedModel from state as model name
        messages: [
          ...messages,
          {
            role: "user",
            content: input,
          },
        ],
        temperature: 0.7,
      }),
    };

    const response = await fetch(
      "http://localhost:8080/v1/chat/completions",
      requestOptions
    );

    const data = await response.json();
    const assistantResponse =
      data?.choices?.[0]?.message?.content || "No response found";

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: input }, // Append user input message
      { role: "assistant", content: assistantResponse },
    ]);

    // Clear input field
    setInput("");
  } catch (error) {
    console.error("Error:", error);
    setError("Failed to fetch response. Please try again: " + error.message); // Update error message
  } finally {
    // Set loading state to false after response or error is received
    setIsLoading(false);
  }
};

  // Scroll to the bottom of the chat container whenever a new message is added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);



  useEffect(() => {
    // Fetch models on component mount
    const fetchModels = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/v1/models"
        );
        const data = await response.json();
        setModels(data?.data || []);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchModels();
  }, []); // Empty dependency array to fetch models only on mount

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

const [selectedModel, setSelectedModel] = useState(""); // Added state for selected model

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
                {message.role === "user" ? "You" : "ChatGpt"}:
              </span>
              <span className="message-content">{message.content}</span>
            </div>
          ))}
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
