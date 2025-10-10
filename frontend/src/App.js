import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Code, BarChart3, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Use CORS proxy to bypass CORS issues
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const PROXIED_API_URL = CORS_PROXY + encodeURIComponent(API_BASE_URL);

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check backend health on component mount
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${PROXIED_API_URL}/health`);
      const data = await response.json();
      
      if (data.status === 'healthy' && data.excelgpt_initialized) {
        setIsConnected(true);
        setConnectionStatus('Connected to ExcelGPT');
      } else {
        setIsConnected(false);
        setConnectionStatus('Backend not ready');
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('Connection failed');
      console.error('Health check failed:', error);
    }
  };

  const sendMessage = async () => {
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

    try {
      // Submit query
      const submitResponse = await fetch(`${PROXIED_API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputValue }),
      });

      const { request_id } = await submitResponse.json();

      // Add processing message
      const processingMessage = {
        id: Date.now() + 1,
        type: 'status',
        content: '🤖 Processing your query...',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, processingMessage]);

      // Poll for results
      await pollForResult(request_id);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: `Failed to send message: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
      setIsLoading(false);
    }
  };

  const pollForResult = async (requestId) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${PROXIED_API_URL}/api/result/${requestId}`);
        const result = await response.json();

        if (result.status === 'completed') {
          // Remove processing message and add result
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.type !== 'status');
            return [...filtered, {
              id: Date.now(),
              type: 'result',
              content: result.insights,
              dataOutput: result.data_output,
              generatedCode: result.generated_code,
              query: result.query,
              timestamp: result.timestamp
            }];
          });
          setIsLoading(false);
        } else if (result.status === 'error') {
          // Remove processing message and add error
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.type !== 'status');
            return [...filtered, {
              id: Date.now(),
              type: 'error',
              content: result.message,
              generatedCode: result.generated_code,
              timestamp: result.timestamp
            }];
          });
          setIsLoading(false);
        } else if (result.status === 'processing') {
          // Update processing message
          setMessages(prev => prev.map(msg => 
            msg.type === 'status' 
              ? { ...msg, content: result.message }
              : msg
          ));
          
          // Continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000); // Poll every second
          } else {
            setMessages(prev => {
              const filtered = prev.filter(msg => msg.type !== 'status');
              return [...filtered, {
                id: Date.now(),
                type: 'error',
                content: 'Request timed out. Please try again.',
                timestamp: new Date().toISOString()
              }];
            });
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error polling for result:', error);
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.type !== 'status');
          return [...filtered, {
            id: Date.now(),
            type: 'error',
            content: `Error getting result: ${error.message}`,
            timestamp: new Date().toISOString()
          }];
        });
        setIsLoading(false);
      }
    };

    poll();
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
