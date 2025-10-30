import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Code, BarChart3, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Updated API_BASE_URL to handle both local and Vercel environments correctly
const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname.includes('vercel.app') 
  ? `https://${window.location.hostname.replace('excelgpt-frontend', 'excel-gpt-zeta')}` 
  : 'http://localhost:8000');

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const connectWebSocket = () => {
      // Create WebSocket URL based on current environment
      let wsUrl;
      if (window.location.hostname.includes('vercel.app')) {
        // For Vercel deployment, use the backend domain
        const backendUrl = API_BASE_URL.replace('https://', 'wss://');
        const clientId = Math.random().toString(36).substr(2, 9);
        wsUrl = `${backendUrl}/ws/${clientId}`;
      } else {
        // For local development
        const clientId = Math.random().toString(36).substr(2, 9);
        wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/${clientId}`;
      }

      console.log('Attempting to connect to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('Connected to ExcelGPT');
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Connection error');
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'status':
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'status',
          content: data.message,
          timestamp: data.timestamp
        }]);
        break;
      
      case 'result':
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'result',
          content: data.insights,
          dataOutput: data.data_output,
          generatedCode: data.generated_code,
          query: data.query,
          timestamp: data.timestamp
        }]);
        setIsLoading(false);
        break;
      
      case 'error':
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'error',
          content: data.message,
          generatedCode: data.generated_code,
          timestamp: data.timestamp
        }]);
        setIsLoading(false);
        break;
      
      case 'pong':
        // Handle ping response
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !isConnected || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Send message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'query',
        query: inputValue
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message) => {
    switch (message.type) {
      case 'user':
        return (
          <div key={message.id} className="flex justify-end mb-4">
            <div className="flex items-start space-x-2 max-w-3xl">
              <div className="message-bubble user-message">
                <p>{message.content}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'status':
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="flex items-start space-x-2 max-w-3xl">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="message-bubble assistant-message">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="status-message">{message.content}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'result':
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="flex items-start space-x-2 max-w-3xl">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="message-bubble assistant-message">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">📊 Analysis Results</h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                  
                  {message.dataOutput && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Data Output
                      </h4>
                      <div className="data-table">
                        <pre className="p-4 text-sm overflow-x-auto">
                          {message.dataOutput}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {message.generatedCode && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium text-gray-900 flex items-center">
                        <Code className="w-4 h-4 mr-2" />
                        View Generated Code
                      </summary>
                      <div className="code-block mt-2">
                        <SyntaxHighlighter
                          language="python"
                          style={tomorrow}
                          showLineNumbers={true}
                        >
                          {message.generatedCode}
                        </SyntaxHighlighter>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="flex items-start space-x-2 max-w-3xl">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="message-bubble bg-red-50 border border-red-200">
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-800">❌ Analysis Failed</h3>
                  <p className="text-red-700">{message.content}</p>
                  
                  {message.generatedCode && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium text-red-800 flex items-center">
                        <Code className="w-4 h-4 mr-2" />
                        View Generated Code
                      </summary>
                      <div className="code-block mt-2">
                        <SyntaxHighlighter
                          language="python"
                          style={tomorrow}
                          showLineNumbers={true}
                        >
                          {message.generatedCode}
                        </SyntaxHighlighter>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ExcelGPT</h1>
            <p className="text-sm text-gray-500">AI-Powered Market Research Analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">{connectionStatus}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to ExcelGPT</h2>
            <p className="text-gray-600 mb-6">Ask me anything about your market research data!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">📊 Brand Analysis</h3>
                <p className="text-sm text-gray-600">"What are the top 5 brands by Power in Brand Equity?"</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">👥 Demographics</h3>
                <p className="text-sm text-gray-600">"How does brand awareness differ between Male and Female consumers?"</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">📈 Trends</h3>
                <p className="text-sm text-gray-600">"Show me the change in brand affinity from H1'23 to H2'25"</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">🎯 Segmentation</h3>
                <p className="text-sm text-gray-600">"Which brands perform best among 18-24 year olds?"</p>
              </div>
            </div>
          </div>
        )}
        
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-container">
        <div className="flex-1">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your market research data..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="1"
            disabled={!isConnected || isLoading}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || !isConnected || isLoading}
          className="send-button flex items-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

export default App;