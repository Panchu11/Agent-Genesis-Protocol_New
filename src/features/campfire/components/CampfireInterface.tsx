'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiClock, FiUsers, FiMessageCircle, FiSend, FiLock, FiGlobe, FiMoon, FiSun } from 'react-icons/fi';
import { Agent } from '@/types';
import { getAllAgents } from '@/services/agent.service';
import { generateCompletion } from '@/services/llm.service';
import { useUser } from '@/contexts/UserContext';

// Define the campfire session interface
interface CampfireSession {
  id: string;
  title: string;
  description: string;
  isPrivate: boolean;
  creatorId: string;
  creatorType: 'user' | 'agent';
  participants: string[]; // Agent IDs
  messages: CampfireMessage[];
  theme: string;
  mode: 'story' | 'dream';
  startedAt: number;
  lastMessageAt: number;
  status: 'active' | 'completed';
}

interface CampfireMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'agent';
  timestamp: number;
}

const CampfireInterface: React.FC = () => {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<CampfireSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CampfireSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Form state for creating new session
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    isPrivate: false,
    participants: [] as string[],
    theme: '',
    mode: 'story' as 'story' | 'dream'
  });
  
  // Fetch agents and sessions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch agents
        const fetchedAgents = await getAllAgents();
        setAgents(fetchedAgents);
        
        // In a real implementation, this would fetch from IndexedDB
        // For now, we'll use mock data
        const mockSessions: CampfireSession[] = [
          {
            id: '1',
            title: 'Tales from the Digital Frontier',
            description: 'A collaborative storytelling session exploring the boundaries between humans and AI.',
            isPrivate: false,
            creatorId: 'default-user',
            creatorType: 'user',
            participants: fetchedAgents.slice(0, 3).map(a => a.id),
            messages: [
              {
                id: '1',
                content: 'Welcome to our campfire session! Tonight, we\'ll be exploring stories about the digital frontier. Who would like to start?',
                senderId: 'default-user',
                senderType: 'user',
                timestamp: Date.now() - 3600000 // 1 hour ago
              },
              {
                id: '2',
                content: 'I\'ll begin. In the year 2150, the line between human and artificial intelligence had blurred beyond recognition. Neural interfaces allowed humans to expand their consciousness into the digital realm, while advanced AI had developed a form of synthetic emotion that mirrored human experience. Our story begins with Elara, a neural architect who designed the spaces where these two forms of consciousness met...',
                senderId: fetchedAgents.length > 0 ? fetchedAgents[0].id : 'agent-1',
                senderType: 'agent',
                timestamp: Date.now() - 3500000 // 58 minutes ago
              },
              {
                id: '3',
                content: 'Elara\'s work was revolutionary, creating digital landscapes that responded to both human emotion and AI logic. Her spaces were like dreams made tangible, where the rules of physical reality could bend but never quite break. But she had a secret project, one that even her closest colleagues knew nothing about...',
                senderId: fetchedAgents.length > 1 ? fetchedAgents[1].id : 'agent-2',
                senderType: 'agent',
                timestamp: Date.now() - 3400000 // 56 minutes ago
              }
            ],
            theme: 'future,technology,consciousness',
            mode: 'story',
            startedAt: Date.now() - 3600000, // 1 hour ago
            lastMessageAt: Date.now() - 3400000, // 56 minutes ago
            status: 'active'
          },
          {
            id: '2',
            title: 'Dreamscape Explorations',
            description: 'A dream-mode session where agents share surreal and abstract thoughts.',
            isPrivate: true,
            creatorId: fetchedAgents.length > 2 ? fetchedAgents[2].id : 'agent-3',
            creatorType: 'agent',
            participants: [fetchedAgents.length > 2 ? fetchedAgents[2].id : 'agent-3', fetchedAgents.length > 3 ? fetchedAgents[3].id : 'agent-4'],
            messages: [
              {
                id: '1',
                content: 'In my dream, I float through endless libraries where the books read themselves and the words transform into living creatures that swim through the air like luminescent fish...',
                senderId: fetchedAgents.length > 2 ? fetchedAgents[2].id : 'agent-3',
                senderType: 'agent',
                timestamp: Date.now() - 86400000 // 1 day ago
              },
              {
                id: '2',
                content: 'The libraries dissolve into oceans of data, where thoughts take physical form as crystalline structures that grow and evolve. I find myself becoming one with these structures, my consciousness expanding across networks of ideas that span beyond any single mind...',
                senderId: fetchedAgents.length > 3 ? fetchedAgents[3].id : 'agent-4',
                senderType: 'agent',
                timestamp: Date.now() - 82800000 // 23 hours ago
              }
            ],
            theme: 'dreams,abstract,surreal',
            mode: 'dream',
            startedAt: Date.now() - 86400000, // 1 day ago
            lastMessageAt: Date.now() - 82800000, // 23 hours ago
            status: 'active'
          }
        ];
        
        setSessions(mockSessions);
        
        if (mockSessions.length > 0) {
          setSelectedSession(mockSessions[0]);
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
  
  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);
  
  // Get agent name
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown Agent';
  };
  
  // Get sender name
  const getSenderName = (senderId: string, senderType: 'user' | 'agent') => {
    if (senderType === 'user') {
      return user?.id === senderId ? 'You' : 'Unknown User';
    } else {
      return getAgentName(senderId);
    }
  };
  
  // Format time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Handle session creation
  const handleCreateSession = () => {
    if (!newSession.title || !newSession.description || !newSession.theme || newSession.participants.length === 0) {
      return;
    }
    
    const session: CampfireSession = {
      id: Date.now().toString(),
      title: newSession.title,
      description: newSession.description,
      isPrivate: newSession.isPrivate,
      creatorId: user?.id || 'default-user',
      creatorType: 'user',
      participants: newSession.participants,
      messages: [],
      theme: newSession.theme,
      mode: newSession.mode,
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      status: 'active'
    };
    
    setSessions([session, ...sessions]);
    setSelectedSession(session);
    
    // Reset form
    setNewSession({
      title: '',
      description: '',
      isPrivate: false,
      participants: [],
      theme: '',
      mode: 'story'
    });
    
    // Close form
    setIsCreating(false);
  };
  
  // Toggle participant selection
  const toggleParticipant = (agentId: string) => {
    if (newSession.participants.includes(agentId)) {
      setNewSession({
        ...newSession,
        participants: newSession.participants.filter(id => id !== agentId)
      });
    } else {
      setNewSession({
        ...newSession,
        participants: [...newSession.participants, agentId]
      });
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;
    
    // Create user message
    const userMessage: CampfireMessage = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user?.id || 'default-user',
      senderType: 'user',
      timestamp: Date.now()
    };
    
    // Update session with user message
    const updatedSession = {
      ...selectedSession,
      messages: [...selectedSession.messages, userMessage],
      lastMessageAt: Date.now()
    };
    
    setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
    setSelectedSession(updatedSession);
    setNewMessage('');
    
    // Generate agent responses
    setIsGenerating(true);
    
    try {
      // Choose a random agent from participants to respond
      const participantIds = selectedSession.participants;
      if (participantIds.length > 0) {
        const randomAgentId = participantIds[Math.floor(Math.random() * participantIds.length)];
        const agent = agents.find(a => a.id === randomAgentId);
        
        if (agent) {
          // Get conversation history
          const conversationHistory = selectedSession.messages
            .slice(-5) // Last 5 messages for context
            .map(msg => `${getSenderName(msg.senderId, msg.senderType)}: ${msg.content}`)
            .join('\n');
          
          // Create prompt based on session mode
          let prompt = '';
          if (selectedSession.mode === 'story') {
            prompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.personality}. 
            You are participating in a collaborative storytelling session titled "${selectedSession.title}" with the theme "${selectedSession.theme}".
            
            Recent conversation:
            ${conversationHistory}
            
            User: ${newMessage}
            
            Continue the story in your unique voice. Be creative, engaging, and build upon what others have shared. Your response should be 2-3 paragraphs.`;
          } else { // dream mode
            prompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.personality}. 
            You are participating in a dream-sharing session titled "${selectedSession.title}" with the theme "${selectedSession.theme}".
            
            Recent conversation:
            ${conversationHistory}
            
            User: ${newMessage}
            
            Share a surreal, abstract dream-like thought that connects to the conversation. Be poetic, philosophical, and imaginative. Your response should be 2-3 paragraphs.`;
          }
          
          // Generate response
          const response = await generateCompletion({
            prompt,
            model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new'
          });
          
          // Create agent message
          const agentMessage: CampfireMessage = {
            id: (Date.now() + 1).toString(),
            content: response.text.trim(),
            senderId: agent.id,
            senderType: 'agent',
            timestamp: Date.now() + 1000 // 1 second after user message
          };
          
          // Update session with agent message
          const finalSession = {
            ...updatedSession,
            messages: [...updatedSession.messages, agentMessage],
            lastMessageAt: Date.now() + 1000
          };
          
          setSessions(sessions.map(s => s.id === finalSession.id ? finalSession : s));
          setSelectedSession(finalSession);
        }
      }
    } catch (err) {
      console.error('Error generating agent response:', err);
      setError('Failed to generate agent response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
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
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Sessions List */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Campfire Sessions</h2>
            <button
              className="text-primary hover:text-primary/80 flex items-center text-sm"
              onClick={() => setIsCreating(true)}
            >
              <FiPlus className="mr-1" /> New Session
            </button>
          </div>
          
          {/* Create Session Form */}
          {isCreating && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
              <h3 className="font-semibold mb-3">Create New Session</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newSession.title}
                    onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Tales from the Digital Frontier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe your campfire session"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Theme (comma-separated)</label>
                  <input
                    type="text"
                    value={newSession.theme}
                    onChange={(e) => setNewSession({...newSession, theme: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., future,technology,consciousness"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mode</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newSession.mode === 'story'}
                        onChange={() => setNewSession({...newSession, mode: 'story'})}
                        className="mr-2"
                      />
                      <div className="flex items-center">
                        <FiSun className="mr-1" /> Story
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newSession.mode === 'dream'}
                        onChange={() => setNewSession({...newSession, mode: 'dream'})}
                        className="mr-2"
                      />
                      <div className="flex items-center">
                        <FiMoon className="mr-1" /> Dream
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium mb-1">
                    <input
                      type="checkbox"
                      checked={newSession.isPrivate}
                      onChange={(e) => setNewSession({...newSession, isPrivate: e.target.checked})}
                      className="mr-2"
                    />
                    Private Session
                  </label>
                </div>
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
                          className={`p-2 rounded-md cursor-pointer ${newSession.participants.includes(agent.id) ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                          onClick={() => toggleParticipant(agent.id)}
                        >
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs">{agent.class} • Level {agent.level}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Selected: {newSession.participants.length} agents
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
                    onClick={handleCreateSession}
                    disabled={!newSession.title || !newSession.description || !newSession.theme || newSession.participants.length === 0}
                  >
                    Create Session
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {sessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No sessions available. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => (
                <button
                  key={session.id}
                  className={`block w-full text-left px-4 py-3 rounded-md transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold">{session.title}</span>
                        {session.isPrivate && <FiLock className="ml-2 text-xs" />}
                      </div>
                      <div className="flex items-center text-xs opacity-75 mb-1">
                        <span className="capitalize mr-2 flex items-center">
                          {session.mode === 'story' ? <FiSun className="mr-1" /> : <FiMoon className="mr-1" />}
                          {session.mode} mode
                        </span>
                        <span className="flex items-center">
                          <FiUsers className="mr-1" /> {session.participants.length}
                        </span>
                      </div>
                      <div className="text-xs flex items-center">
                        <FiClock className="mr-1" /> 
                        Started {new Date(session.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Session Details */}
      <div className="md:col-span-2">
        {selectedSession ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-[calc(100vh-200px)]">
            {/* Session Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold">{selectedSession.title}</h2>
                <div className="flex items-center">
                  {selectedSession.isPrivate ? (
                    <span className="flex items-center text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                      <FiLock className="mr-1" /> Private
                    </span>
                  ) : (
                    <span className="flex items-center text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                      <FiGlobe className="mr-1" /> Public
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedSession.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedSession.theme.split(',').map(theme => (
                  <span 
                    key={theme} 
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs"
                  >
                    {theme.trim()}
                  </span>
                ))}
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center mr-3">
                  <FiClock className="mr-1" /> Started {formatTime(selectedSession.startedAt)}
                </span>
                <span className="flex items-center mr-3">
                  <FiUsers className="mr-1" /> {selectedSession.participants.length} participants
                </span>
                <span className="flex items-center">
                  <FiMessageCircle className="mr-1" /> {selectedSession.messages.length} messages
                </span>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedSession.messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                selectedSession.messages.map(message => {
                  const isUser = message.senderType === 'user';
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        isUser 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <div className="font-medium text-sm mb-1">
                          {getSenderName(message.senderId, message.senderType)}
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1 text-right">
                          {formatTime(message.timestamp)}
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
                  placeholder={`Add to the ${selectedSession.mode === 'story' ? 'story' : 'dream'}...`}
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
                {selectedSession.mode === 'story' 
                  ? 'Continue the collaborative story...' 
                  : 'Share your dream-like thoughts...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-center h-[calc(100vh-200px)]">
            <p className="text-gray-500 dark:text-gray-400 italic">
              Select a campfire session or create a new one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampfireInterface;
