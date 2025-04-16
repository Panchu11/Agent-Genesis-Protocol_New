'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiLock, FiPlus, FiUsers, FiClock, FiKey, FiEye, FiEyeOff, FiSend, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';
import { Agent } from '@/types';
import { getAllAgents } from '@/services/agent.service';
import { useUser } from '@/contexts/UserContext';
import { generateEncryptionKey, encryptData, decryptData } from '@/services/crypto.service';
import { generateCompletion } from '@/services/llm.service';

// Define the enclave interface
interface Enclave {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  participants: string[]; // Agent IDs
  isLocked: boolean;
  createdAt: number;
  lastAccessedAt: number;
}

// Define the encrypted conversation interface
interface EncryptedConversation {
  id: string;
  enclaveId: string;
  encryptedData: string; // Encrypted JSON string of the conversation
}

// Define the conversation interface (after decryption)
interface Conversation {
  id: string;
  enclaveId: string;
  messages: Message[];
}

// Define the message interface
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'agent';
  timestamp: number;
}

const EnclavesInterface: React.FC = () => {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [enclaves, setEnclaves] = useState<Enclave[]>([]);
  const [selectedEnclave, setSelectedEnclave] = useState<Enclave | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Conversation state
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form state for creating new enclave
  const [newEnclave, setNewEnclave] = useState({
    name: '',
    description: '',
    participants: [] as string[],
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  // Fetch agents and enclaves on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch agents
        const fetchedAgents = await getAllAgents();
        setAgents(fetchedAgents);

        // In a real implementation, this would fetch from IndexedDB
        // For now, we'll use mock data
        const mockEnclaves: Enclave[] = [
          {
            id: '1',
            name: 'Project Alpha',
            description: 'Secure enclave for Project Alpha development discussions.',
            creatorId: 'default-user',
            participants: fetchedAgents.slice(0, 2).map(a => a.id),
            isLocked: true,
            createdAt: Date.now() - 604800000, // 1 week ago
            lastAccessedAt: Date.now() - 86400000 // 1 day ago
          },
          {
            id: '2',
            name: 'Personal Assistant',
            description: 'Private space for personal assistant agent interactions.',
            creatorId: 'default-user',
            participants: [fetchedAgents.length > 0 ? fetchedAgents[0].id : 'agent-1'],
            isLocked: false,
            createdAt: Date.now() - 1209600000, // 2 weeks ago
            lastAccessedAt: Date.now() - 172800000 // 2 days ago
          }
        ];

        setEnclaves(mockEnclaves);

        if (mockEnclaves.length > 0) {
          setSelectedEnclave(mockEnclaves[0]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-6 rounded-lg">
        {error}
      </div>
    );
  }

  // Effect to reset authentication when selected enclave changes
  useEffect(() => {
    if (selectedEnclave) {
      // Reset authentication state
      setIsAuthenticated(!selectedEnclave.isLocked);
      setPassword('');
      setAuthError(null);

      // If the enclave is not locked, load the conversation
      if (!selectedEnclave.isLocked) {
        loadConversation();
      }
    }
  }, [selectedEnclave]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Load conversation for the selected enclave
  const loadConversation = () => {
    if (!selectedEnclave) return;

    // In a real implementation, this would fetch from IndexedDB and decrypt if needed
    // For now, we'll use mock data
    const mockConversation: Conversation = {
      id: `conv-${selectedEnclave.id}`,
      enclaveId: selectedEnclave.id,
      messages: [
        {
          id: '1',
          content: `Welcome to the ${selectedEnclave.name} secure enclave. This conversation is ${selectedEnclave.isLocked ? 'encrypted' : 'not encrypted'}.`,
          senderId: 'system',
          senderType: 'agent',
          timestamp: selectedEnclave.createdAt
        }
      ]
    };

    setCurrentConversation(mockConversation);
  };

  // Authenticate with password
  const handleAuthenticate = async () => {
    if (!selectedEnclave || !password) return;

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // In a real implementation, this would attempt to decrypt the conversation
      // For now, we'll just simulate authentication

      // Simulate decryption delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, any password works
      setIsAuthenticated(true);

      // Load the conversation
      loadConversation();
    } catch (err) {
      console.error('Authentication error:', err);
      setAuthError('Invalid password. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!selectedEnclave || !currentConversation || !newMessage.trim() || isGenerating) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user?.id || 'default-user',
      senderType: 'user',
      timestamp: Date.now()
    };

    // Update conversation with user message
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage]
    };

    setCurrentConversation(updatedConversation);
    setNewMessage('');

    // Generate agent response
    setIsGenerating(true);

    try {
      // Choose a random agent from participants to respond
      const participantIds = selectedEnclave.participants;
      if (participantIds.length > 0) {
        const randomAgentId = participantIds[Math.floor(Math.random() * participantIds.length)];
        const agent = agents.find(a => a.id === randomAgentId);

        if (agent) {
          // Get conversation history
          const conversationHistory = updatedConversation.messages
            .slice(-5) // Last 5 messages for context
            .map(msg => `${msg.senderType === 'user' ? 'User' : getAgentName(msg.senderId)}: ${msg.content}`)
            .join('\n');

          // Create prompt
          const prompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.personality}.
          You are participating in a secure, encrypted conversation in an enclave titled "${selectedEnclave.name}".

          Recent conversation:
          ${conversationHistory}

          User: ${newMessage}

          Respond in your unique voice. Be helpful, informative, and engaging. Your response should be concise and to the point.`;

          // Generate response
          const response = await generateCompletion({
            prompt,
            model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new'
          });

          // Create agent message
          const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: response.text.trim(),
            senderId: agent.id,
            senderType: 'agent',
            timestamp: Date.now() + 1000 // 1 second after user message
          };

          // Update conversation with agent message
          const finalConversation = {
            ...updatedConversation,
            messages: [...updatedConversation.messages, agentMessage]
          };

          setCurrentConversation(finalConversation);

          // In a real implementation, we would encrypt and save the conversation to IndexedDB
        }
      }
    } catch (err) {
      console.error('Error generating agent response:', err);
      setError('Failed to generate agent response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get agent name
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId === 'system' ? 'System' : 'Unknown Agent';
  };

  // Toggle participant selection
  const toggleParticipant = (agentId: string) => {
    if (newEnclave.participants.includes(agentId)) {
      setNewEnclave({
        ...newEnclave,
        participants: newEnclave.participants.filter(id => id !== agentId)
      });
    } else {
      setNewEnclave({
        ...newEnclave,
        participants: [...newEnclave.participants, agentId]
      });
    }
  };

  // Handle enclave creation
  const handleCreateEnclave = () => {
    if (!newEnclave.name || !newEnclave.description || newEnclave.participants.length === 0) {
      return;
    }

    // Validate password
    if (newEnclave.password !== newEnclave.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Create new enclave
    const enclave: Enclave = {
      id: Date.now().toString(),
      name: newEnclave.name,
      description: newEnclave.description,
      creatorId: user?.id || 'default-user',
      participants: newEnclave.participants,
      isLocked: newEnclave.password.length > 0,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };

    // In a real implementation, we would encrypt the enclave data with the password
    // and store the encrypted data in IndexedDB

    setEnclaves([enclave, ...enclaves]);
    setSelectedEnclave(enclave);

    // Reset form
    setNewEnclave({
      name: '',
      description: '',
      participants: [],
      password: '',
      confirmPassword: ''
    });

    // Close form
    setIsCreating(false);
  };

  // Generate a random password
  const generatePassword = () => {
    const password = generateEncryptionKey().slice(0, 12);
    setNewEnclave({
      ...newEnclave,
      password,
      confirmPassword: password
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Enclave List */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Secure Enclaves</h2>
            <button
              className="text-primary hover:text-primary/80 flex items-center text-sm"
              onClick={() => setIsCreating(true)}
            >
              <FiPlus className="mr-1" /> New Enclave
            </button>
          </div>

          {/* Create Enclave Form */}
          {isCreating && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
              <h3 className="font-semibold mb-3">Create New Enclave</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newEnclave.name}
                    onChange={(e) => setNewEnclave({...newEnclave, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Project Alpha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newEnclave.description}
                    onChange={(e) => setNewEnclave({...newEnclave, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe your secure enclave"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Encryption Password (Optional)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newEnclave.password}
                      onChange={(e) => setNewEnclave({...newEnclave, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      placeholder="Leave empty for no encryption"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {newEnclave.password ? (
                        <div className="flex items-center">
                          <FiLock className="mr-1" /> Enclave will be encrypted
                        </div>
                      ) : (
                        'No encryption'
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-primary hover:text-primary/80"
                      onClick={generatePassword}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                {newEnclave.password && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newEnclave.confirmPassword}
                        onChange={(e) => setNewEnclave({...newEnclave, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {newEnclave.password !== newEnclave.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Select Participants</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {agents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No agents available. Create some in the Agent Forge first.
                      </p>
                    ) : (
                      agents.map(agent => (
                        <div
                          key={agent.id}
                          className={`p-2 rounded-md cursor-pointer ${newEnclave.participants.includes(agent.id) ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                          onClick={() => toggleParticipant(agent.id)}
                        >
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs">{agent.class} • Level {agent.level}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Selected: {newEnclave.participants.length} agents
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90"
                    onClick={handleCreateEnclave}
                    disabled={!newEnclave.name || !newEnclave.description || newEnclave.participants.length === 0 || (newEnclave.password && newEnclave.password !== newEnclave.confirmPassword)}
                  >
                    Create Enclave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enclave List */}
          {enclaves.length === 0 && !isCreating ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No enclaves available. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {enclaves.map(enclave => (
                <button
                  key={enclave.id}
                  className={`block w-full text-left px-4 py-3 rounded-md transition-colors ${
                    selectedEnclave?.id === enclave.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedEnclave(enclave)}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold">{enclave.name}</span>
                        {enclave.isLocked && <FiLock className="ml-2 text-xs" />}
                      </div>
                      <p className="text-sm truncate">{enclave.description}</p>
                      <div className="flex items-center text-xs opacity-75 mt-1">
                        <span className="flex items-center mr-2">
                          <FiUsers className="mr-1" /> {enclave.participants.length}
                        </span>
                        <span className="flex items-center">
                          <FiClock className="mr-1" /> {new Date(enclave.lastAccessedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enclave Details */}
      <div className="md:col-span-2">
        {selectedEnclave ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-[calc(100vh-200px)]">
            {/* Enclave Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold flex items-center">
                  {selectedEnclave.name}
                  {selectedEnclave.isLocked && (
                    <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center">
                      <FiLock className="mr-1" /> Encrypted
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedEnclave.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedEnclave.participants.map(participantId => {
                  const agent = agents.find(a => a.id === participantId);
                  return (
                    <span
                      key={participantId}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs flex items-center"
                    >
                      {agent ? agent.name : 'Unknown Agent'}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center mr-3">
                  <FiClock className="mr-1" /> Created {new Date(selectedEnclave.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <FiUsers className="mr-1" /> {selectedEnclave.participants.length} participants
                </span>
              </div>
            </div>

            {/* Authentication Required */}
            {selectedEnclave.isLocked && !isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg max-w-md w-full">
                  <div className="flex items-center justify-center text-yellow-500 mb-4">
                    <FiKey className="text-4xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-4">Authentication Required</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    This enclave is encrypted. Please enter the password to access its contents.
                  </p>

                  {authError && (
                    <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4 flex items-center">
                      <FiAlertCircle className="mr-2" />
                      {authError}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                        placeholder="Enter enclave password"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAuthenticate();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center justify-center"
                    onClick={handleAuthenticate}
                    disabled={!password || isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Authenticating...
                      </>
                    ) : (
                      <>Unlock Enclave</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentConversation?.messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    currentConversation?.messages.map(message => {
                      const isUser = message.senderType === 'user' && message.senderId === user?.id;
                      const isSystem = message.senderId === 'system';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            isSystem
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 mx-auto text-center'
                              : isUser
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {!isSystem && (
                              <div className="font-medium text-sm mb-1">
                                {isUser ? 'You' : getAgentName(message.senderId)}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <div className="text-xs opacity-70 mt-1 text-right">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isGenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isGenerating}
                    >
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <FiSend />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {selectedEnclave.isLocked
                      ? 'This conversation is encrypted with your password'
                      : 'This conversation is not encrypted'}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 italic text-center py-12">
              Select an enclave to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnclavesInterface;
