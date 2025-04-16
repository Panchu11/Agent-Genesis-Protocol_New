'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiSave, FiPlay, FiCode, FiTool, FiTarget, FiCpu, FiSettings, FiCheck, FiX } from 'react-icons/fi';
import { Agent } from '@/types';
import { getAllAgents } from '@/services/agent.service';
import { useUser } from '@/contexts/UserContext';
import { generateCompletion } from '@/services/llm.service';

// Define the tool interface
interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'data' | 'communication' | 'memory' | 'custom';
  config: Record<string, any>;
  isEnabled: boolean;
}

// Define the workflow step interface
interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  nextStepId?: string;
}

// Define the advanced agent interface
interface AdvancedAgent extends Agent {
  tools: Tool[];
  workflow: WorkflowStep[];
  systemPrompt: string;
  apiConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  isProduction: boolean;
}

const AgentBuilderInterface: React.FC = () => {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'tools' | 'workflow' | 'system' | 'test'>('basic');
  const [isTesting, setIsTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');

  // Agent state
  const [agent, setAgent] = useState<AdvancedAgent>({
    id: '',
    name: '',
    description: '',
    personality: '',
    goals: [''],
    traits: [],
    memory: {
      conversations: [],
      knowledge: [],
      experiences: []
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    xp: 0,
    level: 1,
    class: 'Scout',
    creator: user?.id || 'default-user',
    tools: [],
    workflow: [],
    systemPrompt: '',
    apiConfig: {
      model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9
    },
    isProduction: false
  });

  // Fetch agents and initialize tools on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const fetchedAgents = await getAllAgents();
        setAgents(fetchedAgents);

        // Initialize with default tools
        const defaultTools: Tool[] = [
          {
            id: '1',
            name: 'Web Search',
            description: 'Search the web for information',
            type: 'web',
            config: {
              searchEngine: 'google',
              maxResults: 5
            },
            isEnabled: false
          },
          {
            id: '2',
            name: 'Web Browser',
            description: 'Browse websites and extract information',
            type: 'web',
            config: {
              userAgent: 'Mozilla/5.0',
              javascript: true
            },
            isEnabled: false
          },
          {
            id: '3',
            name: 'Knowledge Base',
            description: 'Access and query structured knowledge',
            type: 'data',
            config: {
              source: 'local',
              format: 'json'
            },
            isEnabled: false
          },
          {
            id: '4',
            name: 'Memory Storage',
            description: 'Store and retrieve information from memory',
            type: 'memory',
            config: {
              storageType: 'local',
              encryption: false
            },
            isEnabled: false
          },
          {
            id: '5',
            name: 'Email Communication',
            description: 'Send and receive emails',
            type: 'communication',
            config: {
              service: 'smtp',
              requireConfirmation: true
            },
            isEnabled: false
          }
        ];

        setAgent(prev => ({
          ...prev,
          tools: defaultTools
        }));

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle input changes for basic info
  const handleBasicInfoChange = (field: string, value: any) => {
    setAgent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle goal changes
  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...agent.goals];
    newGoals[index] = value;
    setAgent(prev => ({
      ...prev,
      goals: newGoals
    }));
  };

  // Add a new goal
  const handleAddGoal = () => {
    setAgent(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  // Remove a goal
  const handleRemoveGoal = (index: number) => {
    const newGoals = [...agent.goals];
    newGoals.splice(index, 1);
    setAgent(prev => ({
      ...prev,
      goals: newGoals
    }));
  };

  // Handle API config changes
  const handleApiConfigChange = (field: string, value: any) => {
    setAgent(prev => ({
      ...prev,
      apiConfig: {
        ...prev.apiConfig,
        [field]: value
      }
    }));
  };

  // Handle system prompt changes
  const handleSystemPromptChange = (value: string) => {
    setAgent(prev => ({
      ...prev,
      systemPrompt: value
    }));
  };

  // Generate system prompt based on agent configuration
  const generateSystemPrompt = () => {
    const prompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.personality}.

Your goals are:
${agent.goals.map(goal => `- ${goal}`).join('\n')}

You have access to the following tools:
${agent.tools.filter(tool => tool.isEnabled).map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

When responding to users, maintain your personality and focus on achieving your goals.`;

    handleSystemPromptChange(prompt);
  };

  // Test the agent
  const testAgent = async () => {
    if (!testInput.trim()) return;

    setIsTesting(true);
    setTestOutput('');

    try {
      // Create the full prompt
      const prompt = `${agent.systemPrompt}

User: ${testInput}

${agent.name}:`;

      // Generate response
      const response = await generateCompletion({
        prompt,
        model: agent.apiConfig.model,
        temperature: agent.apiConfig.temperature,
        maxTokens: agent.apiConfig.maxTokens,
        topP: agent.apiConfig.topP
      });

      setTestOutput(response.text);
    } catch (err) {
      console.error('Error testing agent:', err);
      setError('Failed to test agent. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  // Save the agent
  const saveAgent = () => {
    // In a real implementation, this would save to IndexedDB
    console.log('Saving agent:', agent);
    // For now, just show a success message
    alert('Agent saved successfully!');
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center ${
            activeTab === 'basic'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('basic')}
        >
          <FiCpu className="mr-2" /> Basic Info
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center ${
            activeTab === 'tools'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('tools')}
        >
          <FiTool className="mr-2" /> Tools
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center ${
            activeTab === 'workflow'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('workflow')}
        >
          <FiTarget className="mr-2" /> Workflow
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center ${
            activeTab === 'system'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('system')}
        >
          <FiCode className="mr-2" /> System Prompt
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center ${
            activeTab === 'test'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('test')}
        >
          <FiPlay className="mr-2" /> Test
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Agent Name</label>
                <input
                  type="text"
                  value={agent.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter agent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Production Ready</label>
                <div className="flex items-center mt-2">
                  <button
                    className={`px-4 py-2 rounded-l-md ${
                      agent.isProduction
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => handleBasicInfoChange('isProduction', true)}
                  >
                    <FiCheck className="mr-1 inline" /> Yes
                  </button>
                  <button
                    className={`px-4 py-2 rounded-r-md ${
                      !agent.isProduction
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => handleBasicInfoChange('isProduction', false)}
                  >
                    <FiX className="mr-1 inline" /> No
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={agent.description}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your agent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Personality</label>
              <textarea
                value={agent.personality}
                onChange={(e) => handleBasicInfoChange('personality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your agent's personality"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Goals</label>
              {agent.goals.map((goal, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Goal ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(index)}
                    className="p-2 text-red-500 hover:text-red-700 rounded-md hover:bg-red-100 dark:hover:bg-red-900"
                    disabled={agent.goals.length === 1}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddGoal}
                className="mt-2 flex items-center text-primary hover:text-primary/80"
              >
                <FiPlus className="mr-1" /> Add Goal
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">API Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <select
                    value={agent.apiConfig.model}
                    onChange={(e) => handleApiConfigChange('model', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new">Dobby Unhinged (70B)</option>
                    <option value="accounts/fireworks/models/llama-v3-70b-instruct">Llama 3 (70B)</option>
                    <option value="accounts/fireworks/models/mixtral-8x7b-instruct">Mixtral (8x7B)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={agent.apiConfig.temperature}
                    onChange={(e) => handleApiConfigChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Precise (0.0)</span>
                    <span>{agent.apiConfig.temperature}</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    max="4096"
                    value={agent.apiConfig.maxTokens}
                    onChange={(e) => handleApiConfigChange('maxTokens', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Top P</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={agent.apiConfig.topP}
                    onChange={(e) => handleApiConfigChange('topP', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Focused (0.0)</span>
                    <span>{agent.apiConfig.topP}</span>
                    <span>Diverse (1.0)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tools Configuration</h2>
              <button
                className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center text-sm"
                onClick={() => {
                  // Add a new custom tool
                  const newTool: Tool = {
                    id: Date.now().toString(),
                    name: 'New Tool',
                    description: 'Custom tool description',
                    type: 'custom',
                    config: {},
                    isEnabled: false
                  };

                  setAgent(prev => ({
                    ...prev,
                    tools: [...prev.tools, newTool]
                  }));
                }}
              >
                <FiPlus className="mr-1" /> Add Custom Tool
              </button>
            </div>

            <div className="space-y-4">
              {agent.tools.map((tool, index) => (
                <div key={tool.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={tool.isEnabled}
                          onChange={() => {
                            const updatedTools = [...agent.tools];
                            updatedTools[index] = {
                              ...updatedTools[index],
                              isEnabled: !updatedTools[index].isEnabled
                            };
                            setAgent(prev => ({
                              ...prev,
                              tools: updatedTools
                            }));
                          }}
                          className="mr-2 h-4 w-4"
                        />
                        <input
                          type="text"
                          value={tool.name}
                          onChange={(e) => {
                            const updatedTools = [...agent.tools];
                            updatedTools[index] = {
                              ...updatedTools[index],
                              name: e.target.value
                            };
                            setAgent(prev => ({
                              ...prev,
                              tools: updatedTools
                            }));
                          }}
                          className="font-semibold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary px-1"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Type: {tool.type.charAt(0).toUpperCase() + tool.type.slice(1)}
                      </div>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700 p-1"
                      onClick={() => {
                        const updatedTools = agent.tools.filter(t => t.id !== tool.id);
                        setAgent(prev => ({
                          ...prev,
                          tools: updatedTools
                        }));
                      }}
                    >
                      <FiX />
                    </button>
                  </div>

                  <div className="mb-3">
                    <textarea
                      value={tool.description}
                      onChange={(e) => {
                        const updatedTools = [...agent.tools];
                        updatedTools[index] = {
                          ...updatedTools[index],
                          description: e.target.value
                        };
                        setAgent(prev => ({
                          ...prev,
                          tools: updatedTools
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Tool description"
                      rows={2}
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <FiSettings className="mr-1" /> Configuration
                    </h4>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                      {tool.type === 'web' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Search Engine</label>
                            <select
                              value={(tool.config.searchEngine as string) || 'google'}
                              onChange={(e) => {
                                const updatedTools = [...agent.tools];
                                updatedTools[index] = {
                                  ...updatedTools[index],
                                  config: {
                                    ...updatedTools[index].config,
                                    searchEngine: e.target.value
                                  }
                                };
                                setAgent(prev => ({
                                  ...prev,
                                  tools: updatedTools
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            >
                              <option value="google">Google</option>
                              <option value="bing">Bing</option>
                              <option value="duckduckgo">DuckDuckGo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Max Results</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={(tool.config.maxResults as number) || 5}
                              onChange={(e) => {
                                const updatedTools = [...agent.tools];
                                updatedTools[index] = {
                                  ...updatedTools[index],
                                  config: {
                                    ...updatedTools[index].config,
                                    maxResults: parseInt(e.target.value)
                                  }
                                };
                                setAgent(prev => ({
                                  ...prev,
                                  tools: updatedTools
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {tool.type === 'data' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Data Source</label>
                            <select
                              value={(tool.config.source as string) || 'local'}
                              onChange={(e) => {
                                const updatedTools = [...agent.tools];
                                updatedTools[index] = {
                                  ...updatedTools[index],
                                  config: {
                                    ...updatedTools[index].config,
                                    source: e.target.value
                                  }
                                };
                                setAgent(prev => ({
                                  ...prev,
                                  tools: updatedTools
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            >
                              <option value="local">Local Storage</option>
                              <option value="api">External API</option>
                              <option value="file">File System</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Data Format</label>
                            <select
                              value={(tool.config.format as string) || 'json'}
                              onChange={(e) => {
                                const updatedTools = [...agent.tools];
                                updatedTools[index] = {
                                  ...updatedTools[index],
                                  config: {
                                    ...updatedTools[index].config,
                                    format: e.target.value
                                  }
                                };
                                setAgent(prev => ({
                                  ...prev,
                                  tools: updatedTools
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            >
                              <option value="json">JSON</option>
                              <option value="csv">CSV</option>
                              <option value="xml">XML</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {tool.type === 'memory' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Storage Type</label>
                            <select
                              value={(tool.config.storageType as string) || 'local'}
                              onChange={(e) => {
                                const updatedTools = [...agent.tools];
                                updatedTools[index] = {
                                  ...updatedTools[index],
                                  config: {
                                    ...updatedTools[index].config,
                                    storageType: e.target.value
                                  }
                                };
                                setAgent(prev => ({
                                  ...prev,
                                  tools: updatedTools
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            >
                              <option value="local">Local Storage</option>
                              <option value="session">Session Storage</option>
                              <option value="indexeddb">IndexedDB</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Encryption</label>
                            <div className="flex items-center mt-1">
                              <input
                                type="checkbox"
                                checked={(tool.config.encryption as boolean) || false}
                                onChange={(e) => {
                                  const updatedTools = [...agent.tools];
                                  updatedTools[index] = {
                                    ...updatedTools[index],
                                    config: {
                                      ...updatedTools[index].config,
                                      encryption: e.target.checked
                                    }
                                  };
                                  setAgent(prev => ({
                                    ...prev,
                                    tools: updatedTools
                                  }));
                                }}
                                className="mr-2 h-4 w-4"
                              />
                              <span className="text-xs">Enable encryption</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {tool.type === 'communication' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Service</label>
                            <select
                              value={(tool.config.service as string) || 'smtp'}
                              onChange={(e) => {
                                const updatedTools = [...agent.tools];
                                updatedTools[index] = {
                                  ...updatedTools[index],
                                  config: {
                                    ...updatedTools[index].config,
                                    service: e.target.value
                                  }
                                };
                                setAgent(prev => ({
                                  ...prev,
                                  tools: updatedTools
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                            >
                              <option value="smtp">SMTP</option>
                              <option value="api">API</option>
                              <option value="webhook">Webhook</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Require Confirmation</label>
                            <div className="flex items-center mt-1">
                              <input
                                type="checkbox"
                                checked={(tool.config.requireConfirmation as boolean) || true}
                                onChange={(e) => {
                                  const updatedTools = [...agent.tools];
                                  updatedTools[index] = {
                                    ...updatedTools[index],
                                    config: {
                                      ...updatedTools[index].config,
                                      requireConfirmation: e.target.checked
                                    }
                                  };
                                  setAgent(prev => ({
                                    ...prev,
                                    tools: updatedTools
                                  }));
                                }}
                                className="mr-2 h-4 w-4"
                              />
                              <span className="text-xs">Require user confirmation</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {tool.type === 'custom' && (
                        <div>
                          <label className="block text-xs font-medium mb-1">Custom Configuration (JSON)</label>
                          <textarea
                            value={JSON.stringify(tool.config, null, 2)}
                            onChange={(e) => {
                              try {
                                const config = JSON.parse(e.target.value);
                                const updatedTools = [...agent.tools];
                                updatedTools[index] = {
                                  ...updatedTools[index],
                                  config
                                };
                                setAgent(prev => ({
                                  ...prev,
                                  tools: updatedTools
                                }));
                              } catch (err) {
                                // Invalid JSON, ignore
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                            rows={4}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {agent.tools.length === 0 && (
                <div className="text-center py-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No tools configured. Add a tool to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Workflow Configuration</h2>
              <button
                className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center text-sm"
                onClick={() => {
                  // Add a new workflow step
                  const newStep: WorkflowStep = {
                    id: Date.now().toString(),
                    name: 'New Step',
                    description: 'Description of this workflow step',
                    condition: 'true',
                    action: 'return "Step executed successfully";'
                  };

                  setAgent(prev => ({
                    ...prev,
                    workflow: [...prev.workflow, newStep]
                  }));
                }}
              >
                <FiPlus className="mr-1" /> Add Step
              </button>
            </div>

            <div className="space-y-4">
              {agent.workflow.map((step, index) => (
                <div key={step.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => {
                          const updatedWorkflow = [...agent.workflow];
                          updatedWorkflow[index] = {
                            ...updatedWorkflow[index],
                            name: e.target.value
                          };
                          setAgent(prev => ({
                            ...prev,
                            workflow: updatedWorkflow
                          }));
                        }}
                        className="font-semibold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary px-1"
                      />
                    </div>
                    <div className="flex items-center">
                      {index > 0 && (
                        <button
                          className="p-1 text-gray-500 hover:text-gray-700 mr-1"
                          onClick={() => {
                            const updatedWorkflow = [...agent.workflow];
                            [updatedWorkflow[index - 1], updatedWorkflow[index]] = [updatedWorkflow[index], updatedWorkflow[index - 1]];
                            setAgent(prev => ({
                              ...prev,
                              workflow: updatedWorkflow
                            }));
                          }}
                          title="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {index < agent.workflow.length - 1 && (
                        <button
                          className="p-1 text-gray-500 hover:text-gray-700 mr-1"
                          onClick={() => {
                            const updatedWorkflow = [...agent.workflow];
                            [updatedWorkflow[index], updatedWorkflow[index + 1]] = [updatedWorkflow[index + 1], updatedWorkflow[index]];
                            setAgent(prev => ({
                              ...prev,
                              workflow: updatedWorkflow
                            }));
                          }}
                          title="Move down"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        className="text-red-500 hover:text-red-700 p-1"
                        onClick={() => {
                          const updatedWorkflow = agent.workflow.filter(s => s.id !== step.id);
                          setAgent(prev => ({
                            ...prev,
                            workflow: updatedWorkflow
                          }));
                        }}
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <textarea
                      value={step.description}
                      onChange={(e) => {
                        const updatedWorkflow = [...agent.workflow];
                        updatedWorkflow[index] = {
                          ...updatedWorkflow[index],
                          description: e.target.value
                        };
                        setAgent(prev => ({
                          ...prev,
                          workflow: updatedWorkflow
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Step description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Condition</label>
                      <textarea
                        value={step.condition}
                        onChange={(e) => {
                          const updatedWorkflow = [...agent.workflow];
                          updatedWorkflow[index] = {
                            ...updatedWorkflow[index],
                            condition: e.target.value
                          };
                          setAgent(prev => ({
                            ...prev,
                            workflow: updatedWorkflow
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                        placeholder="Condition (JavaScript expression)"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JavaScript expression that evaluates to true/false. Use 'input', 'context', and 'tools' variables.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Action</label>
                      <textarea
                        value={step.action}
                        onChange={(e) => {
                          const updatedWorkflow = [...agent.workflow];
                          updatedWorkflow[index] = {
                            ...updatedWorkflow[index],
                            action: e.target.value
                          };
                          setAgent(prev => ({
                            ...prev,
                            workflow: updatedWorkflow
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                        placeholder="Action (JavaScript code)"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JavaScript code to execute. Use 'input', 'context', and 'tools' variables.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Next Step</label>
                    <select
                      value={step.nextStepId || ''}
                      onChange={(e) => {
                        const updatedWorkflow = [...agent.workflow];
                        updatedWorkflow[index] = {
                          ...updatedWorkflow[index],
                          nextStepId: e.target.value || undefined
                        };
                        setAgent(prev => ({
                          ...prev,
                          workflow: updatedWorkflow
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">Default (next in sequence)</option>
                      {agent.workflow.filter(s => s.id !== step.id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="end">End workflow</option>
                    </select>
                  </div>
                </div>
              ))}

              {agent.workflow.length === 0 && (
                <div className="text-center py-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No workflow steps configured. Add a step to get started.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Workflow Execution</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                The workflow executes steps in sequence. Each step is executed only if its condition evaluates to true.
                You can customize the flow by setting the next step for each step.
              </p>
              <div className="flex flex-wrap gap-2">
                {agent.workflow.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div className="text-sm mx-1">{step.name}</div>
                    {index < agent.workflow.length - 1 && (
                      <div className="text-gray-500 dark:text-gray-400">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Prompt Tab */}
        {activeTab === 'system' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">System Prompt</h2>
              <button
                className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center text-sm"
                onClick={generateSystemPrompt}
              >
                <FiCode className="mr-1" /> Generate
              </button>
            </div>
            <textarea
              value={agent.systemPrompt}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              placeholder="Enter system prompt"
              rows={15}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              The system prompt defines your agent's behavior and capabilities. You can generate it automatically based on your configuration or customize it manually.
            </p>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Your Agent</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Input</label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter a test input for your agent"
                rows={3}
              />
            </div>
            <div className="mb-4">
              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
                onClick={testAgent}
                disabled={isTesting || !testInput.trim()}
              >
                {isTesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <FiPlay className="mr-2" /> Test Agent
                  </>
                )}
              </button>
            </div>
            {testOutput && (
              <div>
                <label className="block text-sm font-medium mb-1">Output</label>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap">
                  {testOutput}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
        <button
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
          onClick={saveAgent}
        >
          <FiSave className="mr-2" /> Save Agent
        </button>
      </div>
    </div>
  );
};

export default AgentBuilderInterface;
