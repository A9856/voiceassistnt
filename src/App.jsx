import { useState, useRef } from "react";
import "./app.css";

function App() {
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const recognitionRef = useRef(null);

    // Language detection (English / Hindi Roman / Hindi Devanagari)
  const detectLanguage = (text) => {
    if (/[\u0900-\u097F]/.test(text)) return "hi"; // Devanagari
    const romanHindiWords = ["kya", "hai", "samjhao", "batao", "kaise", "kyu", "mujhe"];
    if (romanHindiWords.some((w) => text.toLowerCase().includes(w))) return "hi";
    return "en";
  };

  // Gemini API Call
  const callGeminiAPI = async (question) => {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: question }] }],
          }),
        }
      );
      const data = await res.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I didn’t understand."
      );
    } catch (error) {
      console.error("Gemini API error:", error);
      return "Network error while fetching answer.";
    }
  };

  // Speak text (auto next question after finish)
  const speak = (text, callback) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-US";

    utterance.onend = () => {
      if (callback) callback();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Handle speech input (multiple questions with "and")
  const handleSpeechInput = async (transcript) => {
    let questions = transcript.split(" and ");
    let index = 0;

    async function processQuestion() {
      if (index < questions.length) {
        let q = questions[index].trim();

        // User question show
        setMessages((prev) => [...prev, { sender: "user", text: q }]);

        // Gemini se answer lo
        let answer = await callGeminiAPI(q);

        // Bot answer show
        setMessages((prev) => [...prev, { sender: "bot", text: answer }]);

        // Voice bolna
        speak(answer, () => {
          index++;
          processQuestion(); // next Q
        });
      }
    }

    processQuestion();
  };

  // Start Listening
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported!");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-US"; // auto detect mix english-hindi
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setListening(true);
    recognitionRef.current.onend = () => setListening(false);

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSpeechInput(transcript);
    };

    recognitionRef.current.start();
  };

  // Stop Listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return (
    <div className="app">
      <h1>🎙 Voice Assistant (English + Hindi Mix)</h1>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender}>
            <b>{msg.sender}:</b> {msg.text}
          </div>
        ))}
      </div>

      <div className="buttons">
        <button
          onClick={startListening}
          disabled={listening}
          className="start-btn"
        >
          {listening ? "Listening..." : "Start Listening"}
        </button>
        <button onClick={stopListening} className="stop-btn">
          Stop
        </button>
      </div>
    </div>
  );
}

export default App;





