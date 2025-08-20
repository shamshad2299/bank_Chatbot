import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';

const Help = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState(null);
  const messagesEndRef = useRef(null);
  const [conversationContext, setConversationContext] = useState([]);

  // Enhanced banking knowledge base with embeddings support
  const bankingKnowledge = [
    {
      question: "hello",
      answer: "Hello! I'm your banking assistant. How can I help you today? 👋",
      keywords: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"]
    },
    {
      question: "how to open account",
      answer: "To open a bank account, you need to provide valid ID proof, address proof, and passport-sized photos. You can visit any branch or apply online through our website. 📝",
      keywords: ["open", "account", "new", "create", "setup", "establish", "start"]
    },
    {
      question: "what is minimum balance",
      answer: "The minimum balance requirement varies by account type:\n- Savings Account: ₹1000\n- Current Account: ₹5000\n- Salary Account: Zero balance 💰",
      keywords: ["minimum", "balance", "required", "maintain", "least", "lowest"]
    },
    {
      question: "how to transfer money",
      answer: "You can transfer money through:\n1. **NEFT/RTGS** - For larger amounts\n2. **IMPS** - Instant transfers\n3. **UPI** - Using UPI ID or QR code\n4. **Mobile Banking** - Through our app 📱",
      keywords: ["transfer", "send", "money", "NEFT", "RTGS", "IMPS", "UPI", "move funds", "wire"]
    },
    {
      question: "lost card what to do",
      answer: "If you've lost your card:\n1. Immediately block it through internet banking or call our 24/7 helpline\n2. Visit the branch to request a replacement\n3. Monitor your transactions for any unauthorized activity 🔒",
      keywords: ["lost", "card", "stolen", "block", "debit", "credit", "missing", "misplaced"]
    },
    {
      question: "loan eligibility",
      answer: "Loan eligibility depends on:\n- Credit score (minimum 650)\n- Income stability\n- Employment type\n- Existing liabilities\n\nYou can check your eligibility through our loan calculator online. 📊",
      keywords: ["loan", "eligibility", "apply", "interest", "rate", "qualify", "borrow", "mortgage"]
    },
    {
      question: "interest rates",
      answer: "Current interest rates:\n- **Savings Account**: 3.5% p.a.\n- **Fixed Deposits**: 6.5-7.2% p.a. (depending on tenure)\n- **Home Loans**: 8.4% p.a.\n- **Personal Loans**: 10.5-15% p.a. 📈",
      keywords: ["interest", "rate", "ROI", "percentage", "yield", "return"]
    },
    {
      question: "account balance",
      answer: "You can check your account balance through:\n1. **Mobile Banking App**\n2. **Internet Banking**\n3. **ATM**\n4. **SMS Banking** (Send BAL to 12345)\n5. **Branch Visit** 📲",
      keywords: ["balance", "account", "check", "inquiry", "amount", "funds"]
    },
    {
      question: "update contact information",
      answer: "To update your contact information:\n1. Visit your nearest branch with ID proof\n2. Use Internet Banking settings\n3. Call our customer care for guidance\nPlease ensure your contact details are always current for security alerts. 📞",
      keywords: ["update", "contact", "phone", "address", "change", "modify", "information"]
    }
  ];

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
            text: "Hello! I'm your AI banking assistant. How can I help you today? 👋",
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
            text: "Hello! I'm your banking assistant. How can I help you today? 👋",
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        if (contextAwareItem) {
          setMessages(prev => [...prev, {
            text: contextAwareItem.answer,
            sender: 'bot',
            timestamp: new Date()
          }]);
        } else {
          // If no match found, use a more intelligent fallback
          const fallbackResponses = [
            "I'm not sure I understand. Could you please rephrase your question?",
            "That's an interesting question. Let me connect you with a human specialist who can help.",
            "I'm still learning about banking services. Could you try asking in a different way?",
            "I don't have information about that yet. Please contact our customer support at 1800-123-4567 for assistance."
          ];
          
          // Select a random fallback response
          const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
          
          setMessages(prev => [...prev, {
            text: randomResponse + " 🤔",
            sender: 'bot',
            timestamp: new Date()
          }]);
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error processing message:', error);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "I'm experiencing technical difficulties. Please try again later or contact our customer support at 1800-123-4567. 🛠️",
          sender: 'bot',
          timestamp: new Date()
        }]);
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

  // Quick questions suggestions
  const quickQuestions = [
    "How to open an account?",
    "What's the minimum balance?",
    "How to transfer money?",
    "Lost my card - what to do?",
    "Loan eligibility criteria",
    "Current interest rates",
    "How to check account balance?",
    "Update contact information"
  ];

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
        </div>

        {/* Quick Questions */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <p className="text-gray-700 font-medium mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Quick questions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickQuestions.map((question, index) => (
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
                    <span className="text-sm">AI is thinking...</span>
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
              placeholder="Ask about banking services..."
              disabled={isLoading}
              className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
        </form>
      </div>
    </div>
  );
};

export default Help;