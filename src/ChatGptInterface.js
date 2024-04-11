import React, { useState, useRef, useEffect, Fragment } from "react";
import "./index.css";

const host = process.env.REACT_APP_API_HOST;
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
              if (jsonStr === "[DONE]") {
                done = true;
              } else {
                const json = JSON.parse(jsonStr);

                // Check if the response contains choices and delta fields
                if (
                  json.choices &&
                  json.choices.length > 0 &&
                  json.choices[0].delta
                ) {
                  const token = json.choices[0].delta.content;
                  if (token !== undefined) {
                    assistantResponse += token;
                    setCurrentAssistantMessage(assistantResponse);
                  }
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

  const fetchModels = async () => {
    try {
      const response = await fetch(`${host}/v1/models`);
      const data = await response.json();
      setModels(data?.data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  useEffect(() => {
    fetchModels();
    const intervalId = setInterval(fetchModels, 10000); // 10000 milliseconds = 10 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const [modelList, setModelList] = useState([]);

  useEffect(() => {
    // Function to fetch data from the API endpoint
    const fetchData = async () => {
      try {
        const response = await fetch(`${host}/models/available`);
        const data = await response.json();

        // Process the data and extract the "name" field from each object
        const names = data.map((item) => item.name);

        // Append the names to the modelList state
        setModelList(names);
        console.log("The list is:",names);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handlemodelSubmit = async (selectedModel) => {
    // Reset error state and set loading state
    setError(null);
    setIsLoading(true);
    const data = {
      id: selectedModel
    };

    const curlCommand = `curl ${host}/models/apply -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    console.log("Equivalent cURL command:", curlCommand);
    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      };

      const response = await fetch(`${host}/models/apply`, requestOptions);
      const responsedata = await response.json();
      console.log("The response URL should be here:",responsedata);
      console.log("Model Apply response is:", response.statusText);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to fetch response. Please try again: " + error.message);
    } finally {
      setIsLoading(false);
      console.log("After fetch");
    }
  };



  const handleGalleryChange = (event) => {
    const selectedModel = event.target.value;
    console.log("the selected model is:",selectedModel);
    handlemodelSubmit(selectedModel);
  };
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
        <select className="left-dropdown"
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
        
        <select className="right-dropdown"
        value={''} // Make sure to set a value, usually an empty string, not the modelList state itself
        onChange={handleGalleryChange}
        disabled={isLoading}
      >
        <option value="">Model Gallery</option>
        {modelList.map((name, index) => (
          <option key={index} value={name}>
            {name}
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
