import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import Avatar from "react-avatar";

const App = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showShortMessage, setShowShortMessage] = useState(false);
  const retryCount = useRef(0);
  const [isBotNotAvailable, setIsBotNotAvailable] = useState(false);
  const modelErrTimerId = useRef(null);

  const handleUserInput = async () => {
    if (!userInput) return;
    const userMessage = { text: userInput, type: "user" };
    setChatHistory((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch(
        `https://blog-app-backend-umber.vercel.app/utility/generate-reply?userInput=${userInput}`,
        {
          method: "GET",
        }
      );

      let response = await res.json();
      response = response.data;
      clearTimeout(modelErrTimerId.current);
      retryCount.current = 0;
      if (!response) {
        throw new Error("Failed to fetch chatbot response");
      }

      const chatbotMessage = {
        text: response,
        type: "chatbot",
      };

      setChatHistory((prev) => [...prev, chatbotMessage]);
    } catch (error) {
      console.log(
        "Error communicating with the OpenAI GPT model:",
        error,
        retryCount.current,
        isBotNotAvailable,
        loading
      );
      if (retryCount.current < 5) {
        retryCount.current = retryCount.current + 1;
        if (modelErrTimerId.current) clearTimeout(modelErrTimerId.current);
        modelErrTimerId.current = setTimeout(() => {
          handleUserInput();
          setLoading(false);
        }, 5 * 1000);
      } else {
        setLoading(false);
        setIsBotNotAvailable(true);
        retryCount.current = 0;
      }
      return;
    } finally {
      setLoading(false);
    }

    setUserInput("");
  };

  useEffect(() => {
    if (isBotNotAvailable) {
      clearTimeout(modelErrTimerId.current);
      retryCount.current = 0;
    }
  }, [isBotNotAvailable]);
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleUserInput();
    }
  };

  useEffect(() => {
    let timer;
    if (loading) {
      let elem = document.getElementsByClassName("loader");
      elem?.[0].scrollIntoView(0, 0);
      timer = setTimeout(() => {
        setShowShortMessage(true);
      }, 2 * 1000); // Change the duration to 5000 milliseconds (5 seconds)
    } else {
      const elemArr = document.getElementsByClassName("message-text");
      const lastElem = elemArr[elemArr.length - 1];
      lastElem?.scrollIntoView(0, 0);
      if (timer) clearTimeout(timer);
      setShowShortMessage(false);
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [loading, retryCount.current]);

  return (
    <div className="app-container">
      <div className="chat-container">
        {chatHistory.length ? (
          <>
            {chatHistory.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="avatar">
                  {message.type === "user" && (
                    <Avatar size="30" round={true} name="You" color="#007bff" />
                  )}
                  {message.type === "chatbot" && (
                    <Avatar size="30" round={true} name="Bot" color="#28a745" />
                  )}
                </div>
                <div className="message-text">{message.text}</div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="welcome-message">
              <p>
                {" "}
                <i>
                  Whether seeking advice, sharing thoughts, or simply engaging
                  in conversation, the chatbot is here to assist you every step
                  of the way. Feel free to <b>kickstart a dialogue</b> by typing
                  in the input field below
                </i>
              </p>
            </div>
          </>
        )}

        {loading || (retryCount.current > 0 && retryCount).current < 5 ? (
          <div className="loader">
            <p>
              <strong>
                {showShortMessage
                  ? `${
                      retryCount.current > 0
                        ? "Too many users at the moment, trying again..."
                        : "Please wait, generating message for you shortly..."
                    }`
                  : `${
                      retryCount.current > 0
                        ? "Too many users at the moment, trying again..."
                        : "Generating message..."
                    }`}
              </strong>
            </p>
          </div>
        ) : null}
      </div>
      <div className="input-container">
        {isBotNotAvailable ? (
          <>
            <p className="loader">
              <strong>
                Too many users at the moment, please try again later
              </strong>
            </p>
          </>
        ) : (
          <>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={handleKeyPress}
              disabled={
                loading || (retryCount.current > 0 && retryCount.current < 5)
              }
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="send-icon"
              onClick={handleUserInput}
              disabled={
                loading || (retryCount.current > 0 && retryCount.current < 5)
              }
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
