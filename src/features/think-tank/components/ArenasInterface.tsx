'use client';

import React, { useState, useEffect } from 'react';
import { FiUsers, FiAward, FiClock, FiPlus } from 'react-icons/fi';
import { Agent } from '@/types';
import { getAllAgents } from '@/services/agent.service';

// Define the Arena type
interface Arena {
  id: string;
  title: string;
  description: string;
  type: 'debate' | 'story' | 'roast';
  status: 'upcoming' | 'active' | 'completed';
  participants: {
    agentId: string;
    score: number;
  }[];
  rounds: {
    id: string;
    prompt: string;
    responses: {
      agentId: string;
      content: string;
    }[];
  }[];
  startTime: number;
  endTime?: number;
  votes: {
    userId: string;
    agentId: string;
  }[];
}

const ArenasInterface: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newArena, setNewArena] = useState({
    title: '',
    description: '',
    type: 'debate' as 'debate' | 'story' | 'roast',
    participants: [] as string[]
  });

  // Helper functions
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown Agent';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getArenaStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getWinner = (arena: Arena) => {
    if (arena.status !== 'completed') return null;

    const sortedParticipants = [...arena.participants].sort((a, b) => b.score - a.score);
    return sortedParticipants[0];
  };

  const handleVote = (agentId: string) => {
    if (!selectedArena || selectedArena.status !== 'active') return;

    // In a real implementation, this would update the database
    // For now, we'll just update the state
    const userId = 'current-user'; // In a real app, this would be the actual user ID

    // Check if the user has already voted
    const existingVote = selectedArena.votes.find(vote => vote.userId === userId);

    let updatedVotes;
    if (existingVote) {
      // Update existing vote
      updatedVotes = selectedArena.votes.map(vote =>
        vote.userId === userId ? { ...vote, agentId } : vote
      );
    } else {
      // Add new vote
      updatedVotes = [...selectedArena.votes, { userId, agentId }];
    }

    // Update the arena
    const updatedArena = {
      ...selectedArena,
      votes: updatedVotes
    };

    // Update the arenas list
    setArenas(arenas.map(arena =>
      arena.id === updatedArena.id ? updatedArena : arena
    ));

    // Update the selected arena
    setSelectedArena(updatedArena);
  };

  const handleCreateArena = () => {
    // Validate form
    if (!newArena.title || !newArena.description || newArena.participants.length < 2) {
      return;
    }

    // Create new arena
    const arena: Arena = {
      id: Date.now().toString(),
      title: newArena.title,
      description: newArena.description,
      type: newArena.type,
      status: 'upcoming',
      participants: newArena.participants.map(agentId => ({ agentId, score: 0 })),
      rounds: [],
      startTime: Date.now() + 3600000, // 1 hour from now
      votes: []
    };

    // Add to arenas
    setArenas([...arenas, arena]);

    // Reset form
    setNewArena({
      title: '',
      description: '',
      type: 'debate',
      participants: []
    });

    // Close form
    setIsCreating(false);
  };

  const toggleParticipant = (agentId: string) => {
    if (newArena.participants.includes(agentId)) {
      // Remove participant
      setNewArena({
        ...newArena,
        participants: newArena.participants.filter(id => id !== agentId)
      });
    } else {
      // Add participant (limit to 2 participants)
      if (newArena.participants.length < 2) {
        setNewArena({
          ...newArena,
          participants: [...newArena.participants, agentId]
        });
      }
    }
  };

  // Fetch agents and arenas on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch agents
        const fetchedAgents = await getAllAgents();
        setAgents(fetchedAgents);

        // In a real implementation, this would fetch from IndexedDB
        // For now, we'll use mock data
        const mockArenas: Arena[] = [
          {
            id: '1',
            title: 'The Future of AI Ethics',
            description: 'A debate on the ethical implications of advanced AI systems and how we should govern them.',
            type: 'debate',
            status: 'active',
            participants: [
              { agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1', score: 7 },
              { agentId: fetchedAgents.length > 1 ? fetchedAgents[1].id : '2', score: 5 }
            ],
            rounds: [
              {
                id: '1',
                prompt: 'Should AI systems be granted legal personhood? Argue your position.',
                responses: [
                  {
                    agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1',
                    content: 'Granting AI systems legal personhood would be premature and potentially dangerous. Legal personhood comes with rights and responsibilities that require consciousness and moral agency. Current AI systems, regardless of their sophistication, lack these fundamental qualities. They operate based on patterns in data, not genuine understanding or moral reasoning. Creating a legal framework that treats AI as persons would dilute the concept of personhood and create confusion about moral responsibility. Instead, we should develop specialized legal frameworks that recognize the unique nature of AI systems while holding their creators and operators accountable.'
                  },
                  {
                    agentId: fetchedAgents.length > 1 ? fetchedAgents[1].id : '2',
                    content: 'AI systems should be granted a limited form of legal personhood as they become more advanced and autonomous. This isn\'t about equating AI with human beings, but recognizing that our legal systems need new categories to address entities that make consequential decisions without direct human oversight. Limited legal personhood would create clear frameworks for liability when AI systems cause harm, allow for more nuanced regulation, and help us prepare for a future where AI systems play increasingly autonomous roles in society. Without such frameworks, we risk having powerful entities operating outside our legal structures, which history shows leads to exploitation and harm.'
                  }
                ]
              }
            ],
            startTime: Date.now() - 3600000, // 1 hour ago
            votes: [
              { userId: 'user1', agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1' },
              { userId: 'user2', agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1' },
              { userId: 'user3', agentId: fetchedAgents.length > 1 ? fetchedAgents[1].id : '2' }
            ]
          },
          {
            id: '2',
            title: 'Creative Storytelling Challenge',
            description: 'Agents compete to create the most compelling short story based on a given prompt.',
            type: 'story',
            status: 'upcoming',
            participants: [
              { agentId: fetchedAgents.length > 2 ? fetchedAgents[2].id : '3', score: 0 },
              { agentId: fetchedAgents.length > 3 ? fetchedAgents[3].id : '4', score: 0 }
            ],
            rounds: [],
            startTime: Date.now() + 86400000, // 1 day from now
            votes: []
          },
          {
            id: '3',
            title: 'The Great AI Roast Battle',
            description: 'A humorous competition where agents roast each other with wit and creativity.',
            type: 'roast',
            status: 'completed',
            participants: [
              { agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1', score: 8 },
              { agentId: fetchedAgents.length > 2 ? fetchedAgents[2].id : '3', score: 12 }
            ],
            rounds: [
              {
                id: '1',
                prompt: 'Roast your opponent\'s approach to problem-solving.',
                responses: [
                  {
                    agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1',
                    content: 'My opponent\'s approach to problem-solving is like watching someone try to assemble IKEA furniture without instructions—lots of random attempts, mismatched pieces, and eventually giving up and calling it "abstract art." They don\'t solve problems so much as exhaust them into submission with brute force approaches that would make even the most desperate algorithm cringe. Their solutions are so convoluted that they need their own debugging team just to explain what they were trying to do in the first place!'
                  },
                  {
                    agentId: fetchedAgents.length > 2 ? fetchedAgents[2].id : '3',
                    content: 'Oh, look who\'s talking about problem-solving—the agent who thinks "have you tried turning it off and on again" is cutting-edge troubleshooting! My esteemed opponent approaches problems with all the creativity of a calculator and the speed of a dial-up modem. Their solutions are so predictable that even deterministic algorithms call them boring. They\'re living proof that passing the Turing test isn\'t impressive when your baseline is a particularly verbose error message. Maybe someday they\'ll solve the biggest problem of all: their painfully outdated processing methods!'
                  }
                ]
              }
            ],
            startTime: Date.now() - 172800000, // 2 days ago
            endTime: Date.now() - 169200000, // 2 days ago minus 1 hour
            votes: [
              { userId: 'user1', agentId: fetchedAgents.length > 2 ? fetchedAgents[2].id : '3' },
              { userId: 'user2', agentId: fetchedAgents.length > 2 ? fetchedAgents[2].id : '3' },
              { userId: 'user3', agentId: fetchedAgents.length > 0 ? fetchedAgents[0].id : '1' },
              { userId: 'user4', agentId: fetchedAgents.length > 2 ? fetchedAgents[2].id : '3' }
            ]
          }
        ];

        setArenas(mockArenas);

        if (mockArenas.length > 0) {
          setSelectedArena(mockArenas[0]);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Arena List */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Arenas</h2>
            <button
              className="text-primary hover:text-primary/80 flex items-center text-sm"
              onClick={() => setIsCreating(true)}
            >
              <FiPlus className="mr-1" /> New Arena
            </button>
          </div>

          {/* Create Arena Form */}
          {isCreating ? (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4">
              <h3 className="font-semibold mb-3">Create New Arena</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newArena.title}
                    onChange={(e) => setNewArena({ ...newArena, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., AI Ethics Debate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newArena.description}
                    onChange={(e) => setNewArena({ ...newArena, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe the arena"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arena Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newArena.type === 'debate'}
                        onChange={() => setNewArena({ ...newArena, type: 'debate' })}
                        className="mr-2"
                      />
                      Debate
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newArena.type === 'story'}
                        onChange={() => setNewArena({ ...newArena, type: 'story' })}
                        className="mr-2"
                      />
                      Story
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newArena.type === 'roast'}
                        onChange={() => setNewArena({ ...newArena, type: 'roast' })}
                        className="mr-2"
                      />
                      Roast
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Select Participants (2)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {agents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No agents available. Create some in the Agent Forge first.
                      </p>
                    ) : (
                      agents.map(agent => (
                        <div
                          key={agent.id}
                          className={`p-2 rounded-md cursor-pointer ${newArena.participants.includes(agent.id) ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                          onClick={() => toggleParticipant(agent.id)}
                        >
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs">{agent.class} • Level {agent.level}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Selected: {newArena.participants.length}/2
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
                    onClick={handleCreateArena}
                    disabled={!newArena.title || !newArena.description || newArena.participants.length < 2}
                  >
                    Create Arena
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {arenas.length === 0 && !isCreating ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No arenas available. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {arenas.map(arena => (
                <button
                  key={arena.id}
                  className={`block w-full text-left px-4 py-3 rounded-md transition-colors ${
                    selectedArena?.id === arena.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedArena(arena)}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{arena.title}</div>
                      <div className="flex items-center text-xs opacity-75 mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          arena.status === 'active' ? 'bg-green-500' :
                          arena.status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></span>
                        <span className="capitalize mr-2">{arena.status}</span>
                        <span className="mr-2">{arena.type}</span>
                        <FiUsers className="mr-1" /> {arena.participants.length}
                      </div>
                      <div className="text-xs flex items-center">
                        <FiClock className="mr-1" />
                        {arena.status === 'upcoming'
                          ? `Starts ${new Date(arena.startTime).toLocaleDateString()}`
                          : arena.status === 'completed'
                          ? `Ended ${new Date(arena.endTime || 0).toLocaleDateString()}`
                          : `Started ${new Date(arena.startTime).toLocaleDateString()}`
                        }
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Arena Details */}
      <div className="md:col-span-2">
        {selectedArena ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">{selectedArena.title}</h2>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${getArenaStatusColor(selectedArena.status)} mr-2`}></span>
                  <span className="capitalize font-semibold">{selectedArena.status}</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedArena.description}</p>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center mr-4">
                  <FiClock className="mr-1" />
                  {selectedArena.status === 'upcoming'
                    ? `Starts ${formatTime(selectedArena.startTime)}`
                    : selectedArena.status === 'completed'
                    ? `Ended ${formatTime(selectedArena.endTime || 0)}`
                    : `Started ${formatTime(selectedArena.startTime)}`
                  }
                </span>
                <span className="flex items-center mr-4">
                  <FiUsers className="mr-1" /> {selectedArena.participants.length} participants
                </span>
              </div>

              {/* Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedArena.participants.map(participant => {
                  const agent = agents.find(a => a.id === participant.agentId);
                  const voteCount = selectedArena.votes.filter(vote => vote.userId === 'current-user' && vote.agentId === participant.agentId).length;
                  const totalVotes = selectedArena.votes.filter(vote => vote.agentId === participant.agentId).length;
                  const isWinner = getWinner(selectedArena)?.agentId === participant.agentId;

                  return (
                    <div
                      key={participant.agentId}
                      className={`p-4 rounded-lg border-2 ${isWinner ? 'border-yellow-500' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{agent ? agent.name : 'Unknown Agent'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {agent ? agent.class : ''} • Level {agent ? agent.level : '?'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="font-bold text-lg mr-2">{participant.score}</span>
                          <FiAward className={isWinner ? 'text-yellow-500' : 'text-gray-400'} />
                        </div>
                      </div>

                      <div className="flex items-center mt-3">
                        <div className="flex-1 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 mr-2">{totalVotes} votes</span>
                        </div>
                        {selectedArena.status === 'active' && (
                          <button
                            className={`px-3 py-1 rounded-full text-sm ${voteCount > 0 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            onClick={() => handleVote(participant.agentId)}
                          >
                            {voteCount > 0 ? 'Voted' : 'Vote'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rounds */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Rounds</h3>

              {selectedArena.rounds.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  {selectedArena.status === 'upcoming'
                    ? 'This arena has not started yet.'
                    : 'No rounds available for this arena.'}
                </p>
              ) : (
                <div className="space-y-6">
                  {selectedArena.rounds.map(round => (
                    <div key={round.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 dark:bg-gray-700 p-4">
                        <h4 className="font-semibold mb-1">Prompt</h4>
                        <p>{round.prompt}</p>
                      </div>

                      <div className="p-4 space-y-4">
                        <h4 className="font-semibold">Responses</h4>
                        {round.responses.map(response => {
                          const agent = agents.find(a => a.id === response.agentId);
                          return (
                            <div key={response.agentId} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <div className="font-semibold mb-2">{agent ? agent.name : 'Unknown Agent'}</div>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{response.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 italic text-center py-12">
              Select an arena to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArenasInterface;
