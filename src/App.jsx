import { useState, useRef, useEffect } from "react";
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

  // Start Listening
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser!");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setListening(true);
    recognitionRef.current.onend = () => setListening(false);

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const lang = detectLanguage(transcript);
      addMessage("user", transcript);
      getBotResponse(transcript, lang, true); // true = first question
    };

    recognitionRef.current.start();
  };

  // Add message to chat
  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
    setTimeout(() => {
      const chatBox = document.querySelector(".chat-box");
      if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
  };

  // Gemini API call
  const getBotResponse = async (text, lang, isFirstQuestion = false) => {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
        }
      );

      const data = await res.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I didn’t understand.";

      addMessage("bot", reply);
      speak(reply, lang, () => {
        if (isFirstQuestion) {
          // 🟢 Auto second question trigger
          const secondQ = lang === "hi" ? "React का use क्या है?" : "What are the uses of React?";
          addMessage("user", secondQ);
          getBotResponse(secondQ, lang, false); // second question answer
        }
      });
    } catch (error) {
      console.error("Gemini API error:", error);
      addMessage("bot", "⚠️ Network error.");
    }
  };

  // Speak text in correct language
  const speak = (text, lang, onEndCallback) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";

    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find((v) =>
      lang === "hi" ? v.lang.includes("hi") : v.lang.includes("en")
    );
    if (selectedVoice) utterance.voice = selectedVoice;

    if (onEndCallback) {
      utterance.onend = () => {
        onEndCallback();
      };
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Ensure voices load
  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  return (
    <div className="app">
      <h1>🎤 Gemini Voice Assistant</h1>

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
          {listening ? "Listening..." : "Start Listening 🎙️"}
        </button>
      </div>
    </div>
  );
}

export default App;


//second 
// import { useState, useRef, useEffect } from "react";
// import "./app.css";

// function App() {
//   const [listening, setListening] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const recognitionRef = useRef(null);

//   // 🔎 Language detection (English / Hindi Roman / Hindi Devanagari)
//   const detectLanguage = (text) => {
//     // अगर देवनागरी script है → Hindi
//     if (/[\u0900-\u097F]/.test(text)) {
//       return "hi";
//     }

//     // Roman Hindi keywords की list
//     const romanHindiWords = [
//       "kya",
//       "hai",
//       "h",
//       "kr",
//       "samjhao",
//       "batao",
//       "kaise",
//       "kyu",
//       "mujhe",
//       "samjhaye",
//     ];

//     const lowerText = text.toLowerCase();
//     if (romanHindiWords.some((w) => lowerText.includes(w))) {
//       return "hi";
//     }

//     // Default English
//     return "en";
//   };

//   // 🎤 Start Listening
//   const startListening = () => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Speech Recognition not supported in this browser!");
//       return;
//     }

//     recognitionRef.current = new SpeechRecognition();
//     recognitionRef.current.lang = "en-US"; // universal recognition
//     recognitionRef.current.interimResults = false;

//     recognitionRef.current.onstart = () => setListening(true);
//     recognitionRef.current.onend = () => setListening(false);

//     recognitionRef.current.onresult = (event) => {
//       const transcript = event.results[0][0].transcript;
//       const lang = detectLanguage(transcript);
//       addMessage("user", transcript);
//       getBotResponse(transcript, lang);
//     };

//     recognitionRef.current.start();
//   };

//   // 🛑 Stop Listening
//   const stopListening = () => {
//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//       setListening(false);
//     }
//   };

//   // 💬 Add message
//   const addMessage = (sender, text) => {
//     setMessages((prev) => [...prev, { sender, text }]);

//     // Auto scroll down
//     setTimeout(() => {
//       const chatBox = document.querySelector(".chat-box");
//       if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
//     }, 100);
//   };

//   // 🤖 Gemini API call
//   const getBotResponse = async (text, lang) => {
//     try {
//       const res = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
//           import.meta.env.VITE_GEMINI_API_KEY
//         }`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             contents: [{ parts: [{ text }] }],
//           }),
//         }
//       );

//       const data = await res.json();
//       console.log("Gemini response:", data);

//       if (data.error) {
//         addMessage("bot", `❌ ${data.error.message}`);
//         speak(`Error: ${data.error.message}`, lang);
//         return;
//       }

//       const reply =
//         data.candidates?.[0]?.content?.parts?.[0]?.text ||
//         "Sorry, I didn’t understand.";

//       addMessage("bot", reply);
//       speak(reply, lang); // 🗣 same language reply
//     } catch (error) {
//       console.error("Gemini API error:", error);
//       addMessage("bot", "⚠️ Network error.");
//     }
//   };

//   // 🔊 Speak text in correct language
//   const speak = (text, lang) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = lang === "hi" ? "hi-IN" : "en-US";

//     const voices = window.speechSynthesis.getVoices();
//     if (voices.length > 0) {
//       const selectedVoice = voices.find((v) =>
//         lang === "hi" ? v.lang.includes("hi") : v.lang.includes("en")
//       );
//       if (selectedVoice) utterance.voice = selectedVoice;
//     }

//     window.speechSynthesis.cancel(); // पहले से बोल रहा हो तो रोक दो
//     window.speechSynthesis.speak(utterance);
//   };

//   // 🟢 Ensure voices are loaded
//   useEffect(() => {
//     window.speechSynthesis.onvoiceschanged = () => {};
//   }, []);

//   return (
//     <div className="app">
//       <h1>🎤 Gemini Voice Assistant</h1>

//       <div className="chat-box">
//         {messages.map((msg, index) => (
//           <div key={index} className={msg.sender}>
//             <b>{msg.sender}:</b> {msg.text}
//           </div>
//         ))}
//       </div>

//       <div className="buttons">
//         <button
//           onClick={startListening}
//           disabled={listening}
//           className="start-btn"
//         >
//           {listening ? "Listening..." : "Start Listening 🎙️"}
//         </button>

//         <button onClick={stopListening} disabled={!listening} className="stop-btn">
//           Stop ❌
//         </button>
//       </div>
//     </div>
//   );
// }

// export default App;



// import { useState, useRef } from "react";
// import "./app.css";

// function App() {
//   const [listening, setListening] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const recognitionRef = useRef(null);

//   // 🎤 Start Listening (Speech Recognition)
//   const startListening = () => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Speech Recognition not supported in this browser!");
//       return;
//     }

//     recognitionRef.current = new SpeechRecognition();
//     recognitionRef.current.lang = "en-US";
//     recognitionRef.current.interimResults = false;

//     recognitionRef.current.onstart = () => setListening(true);
//     recognitionRef.current.onend = () => setListening(false);

//     recognitionRef.current.onresult = (event) => {
//       const transcript = event.results[0][0].transcript;
//       addMessage("user", transcript);
//       getBotResponse(transcript);
//     };

//     recognitionRef.current.start();
//   };

//   // 💬 Add new message
//   const addMessage = (sender, text) => {
//     setMessages((prev) => [...prev, { sender, text }]);
//   };

//   // 🤖 Call Gemini API
//   const getBotResponse = async (text) => {
//     try {
//       const res = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
//           import.meta.env.VITE_GEMINI_API_KEY
//         }`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             contents: [{ parts: [{ text }] }],
//           }),
//         }
//       );

//       const data = await res.json();
//       console.log("Gemini API response:", data);

//       // 🛑 If API returns error
//       if (data.error) {
//         let errorMsg = "Error connecting to Gemini API.";

//         if (data.error.code === 429) {
//           errorMsg = "⚠️ Quota exceeded. Please upgrade your plan or try later.";
//         } else if (data.error.code === 403) {
//           errorMsg = "🚫 Invalid API Key or Access Denied.";
//         } else if (data.error.code === 404) {
//           errorMsg = "❌ Model not found. Check model name.";
//         } else {
//           errorMsg = `❌ ${data.error.message}`;
//         }

//         addMessage("bot", errorMsg);
//         speak(errorMsg);
//         return;
//       }

//       // ✅ Success reply
//       const reply =
//         data.candidates?.[0]?.content?.parts?.[0]?.text ||
//         "Sorry, I didn’t understand.";

//       addMessage("bot", reply);
//       speak(reply);
//     } catch (error) {
//       console.error("Gemini API error:", error);
//       addMessage("bot", "⚠️ Network error. Please check your connection.");
//     }
//   };

//   // 🔊 Text to Speech
//   const speak = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = "en-US";
//     window.speechSynthesis.speak(utterance);
//   };

//   return (
//     <div className="app">
//       <h1>🎤 Gemini Voice Assistant</h1>

//       <div className="chat-box">
//         {messages.map((msg, index) => (
//           <div key={index} className={msg.sender}>
//             <b>{msg.sender}:</b> {msg.text}
//           </div>
//         ))}
//       </div>

//       <button onClick={startListening} className="start-btn">
//         {listening ? "Listening..." : "Start Talking 🎙️"}
//       </button>
//     </div>
//   );
// }

// export default App;
