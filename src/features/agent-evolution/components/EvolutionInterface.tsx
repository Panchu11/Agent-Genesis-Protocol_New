'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiStar, FiAward, FiTrendingUp, FiShield } from 'react-icons/fi';
import { Agent, AgentClass, AgentTrait } from '@/types';
import { getAllAgents, addAgentXP, addAgentTrait } from '@/services/agent.service';

const EvolutionInterface: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xpAmount, setXpAmount] = useState(100);
  const [isAddingTrait, setIsAddingTrait] = useState(false);
  const [newTrait, setNewTrait] = useState({
    name: '',
    description: '',
    effect: ''
  });

  // Fetch agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        const fetchedAgents = await getAllAgents();
        setAgents(fetchedAgents);
        
        if (fetchedAgents.length > 0) {
          setSelectedAgent(fetchedAgents[0]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchAgents();
  }, []);

  const handleAddXP = async () => {
    if (!selectedAgent) return;
    
    try {
      const updatedAgent = await addAgentXP(selectedAgent.id, xpAmount);
      
      if (updatedAgent) {
        // Update the agents list
        setAgents(agents.map(agent => 
          agent.id === updatedAgent.id ? updatedAgent : agent
        ));
        
        // Update the selected agent
        setSelectedAgent(updatedAgent);
      }
    } catch (err) {
      console.error('Error adding XP:', err);
      setError('Failed to add XP. Please try again.');
    }
  };

  const handleAddTrait = async () => {
    if (!selectedAgent) return;
    
    try {
      const updatedAgent = await addAgentTrait(
        selectedAgent.id,
        {
          name: newTrait.name,
          description: newTrait.description,
          effect: newTrait.effect
        }
      );
      
      if (updatedAgent) {
        // Update the agents list
        setAgents(agents.map(agent => 
          agent.id === updatedAgent.id ? updatedAgent : agent
        ));
        
        // Update the selected agent
        setSelectedAgent(updatedAgent);
        
        // Reset the form
        setNewTrait({
          name: '',
          description: '',
          effect: ''
        });
        
        // Close the form
        setIsAddingTrait(false);
      }
    } catch (err) {
      console.error('Error adding trait:', err);
      setError('Failed to add trait. Please try again.');
    }
  };

  const getClassColor = (agentClass: AgentClass) => {
    switch (agentClass) {
      case AgentClass.SCOUT:
        return 'bg-gray-500';
      case AgentClass.EXPLORER:
        return 'bg-blue-500';
      case AgentClass.SPECIALIST:
        return 'bg-green-500';
      case AgentClass.EXPERT:
        return 'bg-yellow-500';
      case AgentClass.MASTER:
        return 'bg-purple-500';
      case AgentClass.SAGE:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateXPToNextLevel = (agent: Agent) => {
    const currentLevel = agent.level;
    const nextLevelXP = Math.pow(currentLevel, 2) * 100;
    return nextLevelXP - agent.xp;
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

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <FiStar className="mx-auto text-4xl text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Agents Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You need to create agents in the Agent Forge before you can evolve them.
        </p>
        <a
          href="/forge"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Go to Agent Forge
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Agent Selection */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Your Agents</h2>
          <div className="space-y-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                className={`block w-full text-left px-4 py-3 rounded-md transition-colors ${
                  selectedAgent?.id === agent.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${getClassColor(agent.class)} flex items-center justify-center text-white font-bold mr-3`}>
                    {agent.level}
                  </div>
                  <div>
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-xs opacity-75">{agent.class} • {agent.xp} XP</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Agent Details */}
      {selectedAgent && (
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className={`w-12 h-12 rounded-full ${getClassColor(selectedAgent.class)} flex items-center justify-center text-white font-bold mr-4`}>
                {selectedAgent.level}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAgent.class} • {selectedAgent.xp} XP • {calculateXPToNextLevel(selectedAgent)} XP to next level
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-300">{selectedAgent.description}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Personality</h3>
              <p className="text-gray-600 dark:text-gray-300">{selectedAgent.personality}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Goals</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                {selectedAgent.goals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            </div>
            
            {/* Traits */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Traits</h3>
                <button
                  className="text-primary hover:text-primary/80 flex items-center text-sm"
                  onClick={() => setIsAddingTrait(true)}
                >
                  <FiPlus className="mr-1" /> Add Trait
                </button>
              </div>
              
              {selectedAgent.traits.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">No traits yet. Add some to enhance your agent's capabilities.</p>
              ) : (
                <div className="space-y-3">
                  {selectedAgent.traits.map(trait => (
                    <div key={trait.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                      <div className="font-semibold mb-1">{trait.name}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{trait.description}</p>
                      <div className="text-xs text-primary flex items-center">
                        <FiShield className="mr-1" /> {trait.effect}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Trait Form */}
              {isAddingTrait && (
                <div className="mt-4 bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                  <h4 className="font-semibold mb-3">Add New Trait</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Trait Name</label>
                      <input
                        type="text"
                        value={newTrait.name}
                        onChange={(e) => setNewTrait({ ...newTrait, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Analytical Thinking"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={newTrait.description}
                        onChange={(e) => setNewTrait({ ...newTrait, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Enhanced ability to analyze complex problems"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Effect</label>
                      <input
                        type="text"
                        value={newTrait.effect}
                        onChange={(e) => setNewTrait({ ...newTrait, effect: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., +20% problem-solving efficiency"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                        onClick={() => setIsAddingTrait(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90"
                        onClick={handleAddTrait}
                        disabled={!newTrait.name || !newTrait.description || !newTrait.effect}
                      >
                        Add Trait
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* XP Addition */}
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Add Experience</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    value={xpAmount}
                    onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
                  onClick={handleAddXP}
                >
                  <FiTrendingUp className="mr-2" /> Add XP
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Add XP to your agent to level up and unlock new capabilities.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvolutionInterface;
