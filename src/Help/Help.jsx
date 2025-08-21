import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';
import { bankingKnowledges } from './BankingKnowledge/BankingKnowledge';

const Help = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState(null);
  const messagesEndRef = useRef(null);
  const [conversationContext, setConversationContext] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [bankingKnowledge, setBankingKnowledge] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState([
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ]);

  // Language-specific content
  const languageContent = {
    en: {
      greeting: "Hello! I'm your AI banking assistant. How can I help you today? 👋",
      listening: "Listening...",
      notUnderstood: "Sorry, I couldn't hear you clearly. Please try again. 🎤",
      quickQuestionsTitle: "Quick questions:",
      quickQuestions: [
        "How to open an account?",
        "What's the minimum balance?",
        "How to transfer money?",
        "Lost my card - what to do?",
        "Loan eligibility criteria",
        "Current interest rates",
        "How to check account balance?",
        "Update contact information"
      ],
      placeholder: "Ask about banking services...",
      aiThinking: "AI is thinking...",
      fallbackResponses: [
        "I'm not sure I understand. Could you please rephrase your question?",
        "That's an interesting question. Let me connect you with a human specialist who can help.",
        "I'm still learning about banking services. Could you try asking in a different way?",
        "I don't have information about that yet. Please contact our customer support at 1800-123-4567 for assistance."
      ],
      errorMessage: "I'm experiencing technical difficulties. Please try again later or contact our customer support at 1800-123-4567. 🛠️"
    },
    hi: {
      greeting: "नमस्ते! मैं आपका AI बैंकिंग सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं? 👋",
      listening: "सुन रहा हूँ...",
      notUnderstood: "क्षमा करें, मैं आपको स्पष्ट रूप से नहीं सुन सका। कृपया पुनः प्रयास करें। 🎤",
      quickQuestionsTitle: "त्वरित प्रश्न:",
      quickQuestions: [
        "खाता कैसे खोलें?",
        "न्यूनतम शेष राशि क्या है?",
        "पैसे कैसे ट्रांसफर करें?",
        "मेरा कार्ड खो गया - क्या करें?",
        "लोन पात्रता मानदंड",
        "वर्तमान ब्याज दरें",
        "खाता शेष कैसे जांचें?",
        "संपर्क जानकारी अपडेट करें"
      ],
      placeholder: "बैंकिंग सेवाओं के बारे में पूछें...",
      aiThinking: "AI सोच रहा है...",
      fallbackResponses: [
        "मुझे यकीन नहीं है कि मैं समझ पाया। क्या आप कृपया अपना प्रश्न दोबारा कह सकते हैं?",
        "यह एक दिलचस्प सवाल है। मैं आपको एक मानव विशेषज्ञ से जोड़ता हूं जो मदद कर सकता है।",
        "मैं अभी भी बैंकिंग सेवाओं के बारे में सीख रहा हूं। क्या आप इसे अलग तरीके से पूछने की कोशिश कर सकते हैं?",
        "मेरे पास अभी तक इसकी जानकारी नहीं है। सहायता के लिए कृपया हमारे ग्राहक सहायता 1800-123-4567 पर संपर्क करें।"
      ],
      errorMessage: "मैं तकनीकी कठिनाइयों का सामना कर रहा हूं। कृपया बाद में पुन: प्रयास करें या हमारे ग्राहक सहायता 1800-123-4567 पर संपर्क करें। 🛠️"
    },
    // Add similar structures for other languages
    // For brevity, I'm showing only English and Hindi fully
    // In a real application, you would complete all languages
    es: { greeting: "¡Hola! Soy tu asistente bancario IA. ¿Cómo puedo ayudarte hoy? 👋" },
    fr: { greeting: "Bonjour ! Je suis votre assistant bancaire IA. Comment puis-je vous aider aujourd'hui ? 👋" },
    de: { greeting: "Hallo! Ich bin Ihr KI-Banking-Assistent. Wie kann ich Ihnen heute helfen? 👋" },
    pt: { greeting: "Olá! Sou seu assistente bancário de IA. Como posso ajudá-lo hoje? 👋" },
    it: { greeting: "Ciao! Sono il tuo assistente bancario AI. Come posso aiutarti oggi? 👋" },
    ru: { greeting: "Привет! Я ваш банковский помощник с ИИ. Как я могу вам помочь сегодня? 👋" },
    ja: { greeting: "こんにちは！私はあなたのAIバンキングアシスタントです。今日はどのようにお手伝いしましょうか？👋" },
    zh: { greeting: "你好！我是您的AI银行助手。今天我能为您提供什么帮助？👋" },
    ar: { greeting: "مرحبًا! أنا مساعدك المصرفي الذكي. كيف يمكنني مساعدتك اليوم؟ 👋" }
  };

  // Initialize speech recognition with current language
  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      // Set language based on current selection
      recognitionRef.current.lang = getSpeechRecognitionLangCode(currentLanguage);

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setMessages(prev => [...prev, {
          text: languageContent[currentLanguage].notUnderstood,
          sender: 'bot',
          timestamp: new Date()
        }]);
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentLanguage]);

  // Update speech recognition when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getSpeechRecognitionLangCode(currentLanguage);
    }
  }, [currentLanguage]);

  // Map language codes to speech recognition codes
  const getSpeechRecognitionLangCode = (langCode) => {
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'pt': 'pt-PT',
      'it': 'it-IT',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'zh': 'zh-CN',
      'ar': 'ar-SA'
    };
    return langMap[langCode] || 'en-US';
  };

  // Enhanced banking knowledge base with multilingual support
  useEffect(() => {
    if (bankingKnowledges) {
      // In a real application, you would have multilingual banking knowledge
      // For this example, we'll use the English knowledge base
      setBankingKnowledge(bankingKnowledges);
    }
  }, []);

  // Load TensorFlow.js and Universal Sentence Encoder
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await use.load();
        setModel(loadedModel);
        
        // Add initial greeting after model is loaded
        setMessages([
          {
            text: languageContent[currentLanguage].greeting,
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
        
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        // Fallback to keyword matching if model fails to load
        setMessages([
          {
            text: languageContent[currentLanguage].greeting,
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, [currentLanguage]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle voice listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setInputMessage(''); // Clear input when starting to listen
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Speak text using speech synthesis
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance();
      speech.text = text;
      speech.volume = 1;
      speech.rate = 1;
      speech.pitch = 1;
      speech.lang = getSpeechRecognitionLangCode(currentLanguage);
      
      window.speechSynthesis.speak(speech);
    }
  };

  // Calculate similarity between user query and knowledge base using embeddings
  const findBestMatch = async (userQuery) => {
    if (!model) return null;

    try {
      // Generate embeddings for user query and all knowledge base questions
      const queries = [userQuery, ...bankingKnowledge.map(item => item.question)];
      const embeddings = await model.embed(queries);
      
      // Calculate cosine similarity between user query and each knowledge base item
      const queryEmbedding = embeddings.slice([0, 0], [1]);
      const knowledgeEmbeddings = embeddings.slice([1, 0], [bankingKnowledge.length]);
      
      const similarities = [];
      for (let i = 0; i < bankingKnowledge.length; i++) {
        const knowledgeEmbedding = knowledgeEmbeddings.slice([i, 0], [1]);
        const similarity = await calculateCosineSimilarity(queryEmbedding, knowledgeEmbedding);
        similarities.push({ index: i, similarity: similarity.dataSync()[0] });
      }
      
      // Sort by similarity and return the best match
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // Return the best match if similarity is above threshold
      if (similarities[0].similarity > 0.5) {
        return bankingKnowledge[similarities[0].index];
      }
      
      return null;
    } catch (error) {
      console.error('Error finding match:', error);
      return null;
    }
  };

  // Calculate cosine similarity between two tensors
  const calculateCosineSimilarity = async (a, b) => {
    const aNormalized = a.div(a.norm());
    const bNormalized = b.div(b.norm());
    return aNormalized.dot(bNormalized.transpose());
  };

  // Fallback to keyword matching if embedding approach fails
  const keywordMatch = (message) => {
    const lowerMessage = message.toLowerCase();
    
    for (const item of bankingKnowledge) {
      if (item.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase()) ||
        calculateLevenshteinSimilarity(lowerMessage, keyword.toLowerCase()) > 0.8
      )) {
        return item;
      }
    }
    
    return null;
  };

  // Calculate string similarity using Levenshtein distance
  const calculateLevenshteinSimilarity = (a, b) => {
    const matrix = [];
    
    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }
    
    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  };

  // Handle context-aware responses
  const getContextAwareResponse = (userMessage, matchedItem) => {
    // Simple context tracking - in a real application, this would be more sophisticated
    const lastUserMessage = conversationContext[conversationContext.length - 1];
    
    if (lastUserMessage && lastUserMessage.toLowerCase().includes("loan") && 
        userMessage.toLowerCase().includes("document")) {
      return {
        answer: "For loan applications, you typically need:\n- ID proof (Aadhaar, PAN, Passport)\n- Address proof\n- Income documents (salary slips, bank statements)\n- Employment proof\n\nWould you like to know about specific loan types? 📄",
        question: "loan documents"
      };
    }
    
    return matchedItem;
  };

  // Process user message
  const processMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message to chat and context
    const userMessage = {
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setConversationContext(prev => [...prev, message]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Try to find a match using embeddings first
      let matchedItem = await findBestMatch(message);
      
      // If no match found with embeddings, try keyword matching
      if (!matchedItem) {
        matchedItem = keywordMatch(message);
      }
      
      // Apply context if available
      const contextAwareItem = getContextAwareResponse(message, matchedItem);
      
      setTimeout(() => {
        let botResponse;
        
        if (contextAwareItem) {
          botResponse = contextAwareItem.answer;
        } else {
          // If no match found, use a more intelligent fallback
          const fallbackResponses = languageContent[currentLanguage].fallbackResponses;
          
          // Select a random fallback response
          botResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] + " 🤔";
        }
        
        setMessages(prev => [...prev, {
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        }]);
        
        // Speak the response
        speakText(botResponse.replace(/[^\w\s!?.,]/g, ''));
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error processing message:', error);
      setTimeout(() => {
        const errorMessage = languageContent[currentLanguage].errorMessage;
        setMessages(prev => [...prev, {
          text: errorMessage,
          sender: 'bot',
          timestamp: new Date()
        }]);
        
        // Speak the error message
        speakText(errorMessage);
        
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    processMessage(inputMessage);
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    processMessage(question);
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    
    // Update the chat with a greeting in the new language
    setMessages([
      {
        text: languageContent[langCode].greeting,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  if (isModelLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading AI assistant...</p>
          <p className="mt-2 text-gray-500 text-sm">Initializing neural networks for better banking assistance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-2xl mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">AI Banking Assistant</h2>
                <p className="text-gray-600">Powered by TensorFlow.js for smarter banking help</p>
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors">
                <span>{availableLanguages.find(lang => lang.code === currentLanguage)?.flag}</span>
                <span className="hidden md:inline">{availableLanguages.find(lang => lang.code === currentLanguage)?.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-10 hidden group-hover:block">
                {availableLanguages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      currentLanguage === language.code ? 'bg-indigo-50 text-indigo-700' : ''
                    }`}
                  >
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <p className="text-gray-700 font-medium mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {languageContent[currentLanguage].quickQuestionsTitle}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languageContent[currentLanguage].quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-xl py-2 px-4 transition-colors duration-200 text-left"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-2xl shadow-md p-4 flex-1 flex flex-col mb-6">
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md rounded-2xl p-4 ${message.sender === 'user' 
                  ? 'bg-indigo-500 text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                  <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none p-4">
                  <div className="flex items-center">
                    <div className="flex space-x-2 mr-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm">{languageContent[currentLanguage].aiThinking}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={languageContent[currentLanguage].placeholder}
              disabled={isLoading}
              className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-3 rounded-2xl ${isListening 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors duration-200`}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !inputMessage.trim()}
              className="bg-indigo-600 text-white rounded-2xl p-3 disabled:opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {isListening && (
            <div className="mt-2 text-sm text-indigo-600 flex items-center">
              <div className="flex space-x-1 mr-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              {languageContent[currentLanguage].listening}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Help;