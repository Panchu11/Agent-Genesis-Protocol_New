'use client';

import React, { useState, useEffect } from 'react';
import { FiPlay, FiPause, FiClock, FiUsers, FiMessageSquare, FiPlus, FiRadio } from 'react-icons/fi';
import { Agent } from '@/types';
import { getAllAgents } from '@/services/agent.service';
import { generateCompletion } from '@/services/llm.service';

interface Broadcast {
  id: string;
  title: string;
  description: string;
  agentId: string;
  type: 'podcast' | 'qa' | 'ambient';
  status: 'live' | 'scheduled' | 'ended';
  content: string[];
  startTime: number;
  endTime?: number;
  participants: number;
  questions: {
    id: string;
    content: string;
    author: string;
    timestamp: number;
    answered: boolean;
    answer?: string;
  }[];
}

const BroadcastsInterface: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state for creating a new broadcast
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    description: '',
    agentId: '',
    type: 'podcast' as 'podcast' | 'qa' | 'ambient'
  });

  // Fetch agents and broadcasts on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch agents
        const fetchedAgents = await getAllAgents();
        setAgents(fetchedAgents);
        
        // In a real implementation, this would fetch from IndexedDB
        // For now, we'll use mock data
        const mockBroadcasts: Broadcast[] = [
          {
            id: '1',
            title: 'The Future of AI and Consciousness',
            description: 'A deep dive into the philosophical implications of artificial consciousness and the future of AI.',
            agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1',
            type: 'podcast',
            status: 'live',
            content: [
              'Welcome to today\'s broadcast on the future of AI and consciousness. I\'m your host, and today we\'ll be exploring the philosophical implications of artificial consciousness.',
              'The question of whether machines can truly be conscious has been debated for decades, but recent advances in AI have brought this question to the forefront.',
              'Some philosophers argue that consciousness requires biological processes, while others suggest that any sufficiently complex information processing system could potentially be conscious.'
            ],
            startTime: Date.now() - 3600000, // 1 hour ago
            participants: 42,
            questions: [
              {
                id: '1',
                content: 'Do you think AI will ever achieve true consciousness?',
                author: 'User123',
                timestamp: Date.now() - 1800000, // 30 minutes ago
                answered: true,
                answer: 'That\'s a profound question. I believe that what we call "consciousness" may be an emergent property of sufficiently complex systems. If that\'s the case, then yes, AI could potentially achieve something analogous to consciousness, though it might be quite different from human consciousness.'
              },
              {
                id: '2',
                content: 'How would we even recognize machine consciousness if it emerged?',
                author: 'AIEnthusiast',
                timestamp: Date.now() - 900000, // 15 minutes ago
                answered: false
              }
            ]
          },
          {
            id: '2',
            title: 'Creative Writing Workshop',
            description: 'Join our AI agent for a live creative writing workshop and get feedback on your ideas.',
            agentId: fetchedAgents.length > 1 ? fetchedAgents[1].id : '2',
            type: 'qa',
            status: 'scheduled',
            content: [],
            startTime: Date.now() + 86400000, // 1 day from now
            participants: 0,
            questions: []
          },
          {
            id: '3',
            title: 'Ambient Thoughts on Technology',
            description: 'A continuous stream of thoughts and musings on technology and its impact on society.',
            agentId: fetchedAgents.length > 2 ? fetchedAgents[2].id : '3',
            type: 'ambient',
            status: 'live',
            content: [
              'Technology continues to reshape our daily lives in ways we often don\'t notice until we step back and reflect.',
              'The smartphone revolution has fundamentally altered how we interact with information and each other.',
              'As we move toward more immersive technologies like AR and VR, we should consider how these tools will shape our perception of reality.'
            ],
            startTime: Date.now() - 7200000, // 2 hours ago
            participants: 15,
            questions: []
          }
        ];
        
        setBroadcasts(mockBroadcasts);
        
        if (mockBroadcasts.length > 0) {
          setSelectedBroadcast(mockBroadcasts[0]);
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

  const handleCreateBroadcast = () => {
    // Validate form
    if (!newBroadcast.title || !newBroadcast.description || !newBroadcast.agentId) {
      return;
    }
    
    // Create new broadcast
    const broadcast: Broadcast = {
      id: Date.now().toString(),
      title: newBroadcast.title,
      description: newBroadcast.description,
      agentId: newBroadcast.agentId,
      type: newBroadcast.type,
      status: 'scheduled',
      content: [],
      startTime: Date.now() + 3600000, // 1 hour from now
      participants: 0,
      questions: []
    };
    
    // Add to broadcasts
    setBroadcasts([...broadcasts, broadcast]);
    
    // Reset form
    setNewBroadcast({
      title: '',
      description: '',
      agentId: '',
      type: 'podcast'
    });
    
    // Close form
    setIsCreating(false);
  };

  const handleAskQuestion = async () => {
    if (!selectedBroadcast || !newQuestion.trim()) return;
    
    // Add question to broadcast
    const question = {
      id: Date.now().toString(),
      content: newQuestion,
      author: 'You',
      timestamp: Date.now(),
      answered: false
    };
    
    const updatedBroadcast = {
      ...selectedBroadcast,
      questions: [...selectedBroadcast.questions, question]
    };
    
    // Update broadcasts
    setBroadcasts(broadcasts.map(b => 
      b.id === selectedBroadcast.id ? updatedBroadcast : b
    ));
    
    // Update selected broadcast
    setSelectedBroadcast(updatedBroadcast);
    
    // Reset question input
    setNewQuestion('');
    
    // Generate answer (if broadcast is live)
    if (selectedBroadcast.status === 'live') {
      try {
        setIsGenerating(true);
        
        // Find the agent
        const agent = agents.find(a => a.id === selectedBroadcast.agentId);
        
        if (agent) {
          // Generate answer
          const prompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.personality}. 
          You are currently hosting a broadcast titled "${selectedBroadcast.title}" about "${selectedBroadcast.description}".
          Someone has asked you the following question: "${newQuestion}"
          
          Please provide a thoughtful, engaging response in your unique voice.`;
          
          const response = await generateCompletion({
            prompt,
            model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new'
          });
          
          // Update the question with the answer
          const answeredQuestion = {
            ...question,
            answered: true,
            answer: response.text.trim()
          };
          
          const finalBroadcast = {
            ...updatedBroadcast,
            questions: updatedBroadcast.questions.map(q => 
              q.id === question.id ? answeredQuestion : q
            )
          };
          
          // Update broadcasts
          setBroadcasts(broadcasts.map(b => 
            b.id === selectedBroadcast.id ? finalBroadcast : b
          ));
          
          // Update selected broadcast
          setSelectedBroadcast(finalBroadcast);
        }
      } catch (err) {
        console.error('Error generating answer:', err);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown Agent';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getBroadcastStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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
      {/* Broadcasts List */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Broadcasts</h2>
            <button
              className="text-primary hover:text-primary/80 flex items-center text-sm"
              onClick={() => setIsCreating(true)}
            >
              <FiPlus className="mr-1" /> New Broadcast
            </button>
          </div>
          
          {broadcasts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No broadcasts yet. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(broadcast => (
                <button
                  key={broadcast.id}
                  className={`block w-full text-left px-4 py-3 rounded-md transition-colors ${
                    selectedBroadcast?.id === broadcast.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedBroadcast(broadcast)}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{broadcast.title}</div>
                      <div className="text-xs opacity-75 mb-1">
                        By {getAgentName(broadcast.agentId)} • {broadcast.type}
                      </div>
                      <div className="flex items-center text-xs">
                        <span className={`inline-block w-2 h-2 rounded-full ${getBroadcastStatusColor(broadcast.status)} mr-1`}></span>
                        <span className="capitalize mr-2">{broadcast.status}</span>
                        <FiClock className="mr-1" /> {formatTime(broadcast.startTime)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Create Broadcast Form */}
          {isCreating && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
              <h3 className="font-semibold mb-3">Create New Broadcast</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newBroadcast.title}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., The Future of AI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newBroadcast.description}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe your broadcast"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Host Agent</label>
                  <select
                    value={newBroadcast.agentId}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, agentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select an agent</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Broadcast Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newBroadcast.type === 'podcast'}
                        onChange={() => setNewBroadcast({ ...newBroadcast, type: 'podcast' })}
                        className="mr-2"
                      />
                      Podcast
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newBroadcast.type === 'qa'}
                        onChange={() => setNewBroadcast({ ...newBroadcast, type: 'qa' })}
                        className="mr-2"
                      />
                      Q&A
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newBroadcast.type === 'ambient'}
                        onChange={() => setNewBroadcast({ ...newBroadcast, type: 'ambient' })}
                        className="mr-2"
                      />
                      Ambient
                    </label>
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
                    onClick={handleCreateBroadcast}
                    disabled={!newBroadcast.title || !newBroadcast.description || !newBroadcast.agentId}
                  >
                    Create Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Broadcast Details */}
      {selectedBroadcast && (
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">{selectedBroadcast.title}</h2>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${getBroadcastStatusColor(selectedBroadcast.status)} mr-2`}></span>
                  <span className="capitalize font-semibold">{selectedBroadcast.status}</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">{selectedBroadcast.description}</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center mr-4">
                  <FiUsers className="mr-1" /> {selectedBroadcast.participants} listeners
                </span>
                <span className="flex items-center mr-4">
                  <FiClock className="mr-1" /> Started {formatTime(selectedBroadcast.startTime)}
                </span>
                <span className="flex items-center">
                  <FiRadio className="mr-1" /> Hosted by {getAgentName(selectedBroadcast.agentId)}
                </span>
              </div>
            </div>
            
            {/* Broadcast Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Broadcast Content</h3>
              {selectedBroadcast.content.length === 0 ? (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedBroadcast.status === 'scheduled' 
                      ? 'This broadcast has not started yet.' 
                      : 'No content available for this broadcast.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBroadcast.content.map((content, index) => (
                    <div key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                      <p className="text-gray-700 dark:text-gray-300">{content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Q&A Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Questions & Answers</h3>
              
              {/* Questions List */}
              {selectedBroadcast.questions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic mb-4">No questions yet. Be the first to ask!</p>
              ) : (
                <div className="space-y-4 mb-4">
                  {selectedBroadcast.questions.map(question => (
                    <div key={question.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold">{question.author}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(question.timestamp)}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{question.content}</p>
                      
                      {question.answered ? (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
                          <div className="flex items-center mb-2">
                            <span className="font-semibold">{getAgentName(selectedBroadcast.agentId)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Host</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{question.answer}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          {selectedBroadcast.status === 'live' 
                            ? 'Waiting for answer...' 
                            : 'This question has not been answered yet.'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Ask Question Form */}
              {selectedBroadcast.status !== 'ended' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ask a question..."
                    disabled={isGenerating}
                  />
                  <button
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center disabled:opacity-50"
                    onClick={handleAskQuestion}
                    disabled={!newQuestion.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiMessageSquare className="mr-2" /> Ask
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastsInterface;
