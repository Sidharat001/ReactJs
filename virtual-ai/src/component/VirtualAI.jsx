import { useState, useRef, useEffect, useCallback } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import run from "../server";

const VirtualAI = () => {
    const [isListening, setIsListening] = useState(false);
    const [isloading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState("");
    const [voices, setVoices] = useState([]);
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const [response, setResponse] = useState([])

    // Load available voices
    useEffect(() => {
        const handleVoicesChanged = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        handleVoicesChanged();

        return () => {
            speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
    }, []);

    // Initialize speech recognition for Hindi
    useEffect(() => {
        if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "hi-IN"; // Hindi language

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join("");
                setInputText(transcript);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
        }

        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const handleListen = useCallback(() => {
        if (!recognitionRef.current) return;

        setIsListening(prev => {
            if (!prev) {
                try {
                    recognitionRef.current.start();
                } catch (error) {
                    console.error("Recognition start error:", error);
                    return false;
                }
            } else {
                recognitionRef.current.stop();
            }
            return !prev;
        });
    }, []);

    const processInput = useCallback(async () => {
        if (!inputText) return;

        try {
            console.log(inputText);
            setIsLoading(true)
            const result = await run(inputText);
            setResponse((prevResponse) => [...prevResponse, result.response.text()])
            console.log(response)
            setIsLoading(false);
            speakResponse(result.response.text());
        } catch (error) {
            console.error("Processing error:", error);
            speakResponse("कुछ त्रुटि हुई। कृपया पुनः प्रयास करें।");
            setIsListening(false);
        } finally {
            setInputText("");
        }
    }, [inputText]);

    useEffect(() => {
        if (inputText) {
            timeoutRef.current = setTimeout(processInput, 400);
            return () => clearTimeout(timeoutRef.current);
        }
    }, [inputText, processInput]);

    const speakResponse = useCallback((response) => {
        const synth = window.speechSynthesis;
        synth.cancel(); // Stop any current speech

        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = "hi-IN";
        utterance.name = "Google हिन्दी"
        utterance.default = true

        // Find Hindi female voice (adjust names based on available voices)
        const hindiFemaleVoice = voices.find(voice =>
            voice.lang === "hi-IN" &&
            (voice.name.includes("Female") ||
                voice.name.includes("हिन्दी") ||
                voice.name.includes("Leela"))
        );

        if (hindiFemaleVoice) {
            utterance.voice = hindiFemaleVoice;
        } else {
            console.warn("Hindi female voice not found, using default Hindi voice");
            const hindiVoice = voices.find(voice => voice.lang === "hi-IN");
            if (hindiVoice) utterance.voice = hindiVoice;
        }

        synth.speak(utterance);
    }, [voices]);

    return (
        <div className="ai-container">
            <h1 className="ai-header">NEXUS AI</h1>

            <div className="chat-container">
                {response.map(res => (
                    <>
                        <div className="ai-message my-3">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-robot me-2"></i>
                                <span>{res}</span>
                            </div>
                        </div>
                    </>
                ))}
                {isloading && (
                    <div className="d-flex align-items-center">
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleListen}
                className={`mic-button ${isListening ? 'listening' : ''}`}
                disabled={!recognitionRef.current}
                aria-label={isListening ? "सुनना बंद करें" : "सुनना शुरू करें"}
            >
                {isListening ? (
                    <FaStop size={30} />
                ) : (
                    <FaMicrophone size={30} />
                )}
                {isListening && <div className="pulse-ring"></div>}
            </button>
        </div>
    );
};

export default VirtualAI;