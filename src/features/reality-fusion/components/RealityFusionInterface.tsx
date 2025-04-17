'use client';

import React, { useState, useEffect } from 'react';
import { FiClipboard, FiFile, FiGlobe, FiCpu, FiPlus, FiTrash2, FiRefreshCw, FiLink, FiCheck } from 'react-icons/fi';
import { Agent } from '@/types';
import { getAllAgents } from '@/services/agent.service';
import { useUser } from '@/contexts/UserContext';
import { generateCompletion } from '@/services/llm.service';

// Define the reality source interface
interface RealitySource {
  id: string;
  name: string;
  type: 'clipboard' | 'file' | 'browser' | 'custom';
  content: string;
  lastUpdated: number;
  isConnected: boolean;
}

const RealityFusionInterface: React.FC = () => {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [sources, setSources] = useState<RealitySource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState('');
  const [clipboardContent, setClipboardContent] = useState('');
  
  // Fetch agents on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch agents
        const fetchedAgents = await getAllAgents();
        setAgents(fetchedAgents);
        
        if (fetchedAgents.length > 0) {
          setSelectedAgent(fetchedAgents[0].id);
        }
        
        // Initialize with default sources
        const defaultSources: RealitySource[] = [
          {
            id: '1',
            name: 'Clipboard',
            type: 'clipboard',
            content: '',
            lastUpdated: Date.now(),
            isConnected: false
          },
          {
            id: '2',
            name: 'Current Browser Tab',
            type: 'browser',
            content: 'This is a simulation of browser tab content. In a real implementation, this would be the actual content of the current browser tab.',
            lastUpdated: Date.now(),
            isConnected: false
          }
        ];
        
        setSources(defaultSources);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Read clipboard
  const readClipboard = async () => {
    try {
      // In a real implementation, this would use the Clipboard API
      // For now, we'll simulate clipboard content
      const simulatedClipboardContent = 'This is simulated clipboard content. In a real implementation, this would be the actual content of your clipboard.';
      
      setClipboardContent(simulatedClipboardContent);
      
      // Update the clipboard source
      setSources(prevSources => 
        prevSources.map(source => 
          source.type === 'clipboard' 
            ? { ...source, content: simulatedClipboardContent, lastUpdated: Date.now() }
            : source
        )
      );
    } catch (err) {
      console.error('Error reading clipboard:', err);
      setError('Failed to read clipboard. Please try again.');
    }
  };
  
  // Connect/disconnect source
  const toggleSourceConnection = (sourceId: string) => {
    setSources(prevSources => 
      prevSources.map(source => 
        source.id === sourceId 
          ? { ...source, isConnected: !source.isConnected }
          : source
      )
    );
  };
  
  // Add new source
  const addNewSource = () => {
    const newSource: RealitySource = {
      id: Date.now().toString(),
      name: 'New Source',
      type: 'custom',
      content: '',
      lastUpdated: Date.now(),
      isConnected: false
    };
    
    setSources([...sources, newSource]);
  };
  
  // Remove source
  const removeSource = (sourceId: string) => {
    setSources(sources.filter(source => source.id !== sourceId));
  };
  
  // Update source
  const updateSource = (sourceId: string, field: string, value: any) => {
    setSources(prevSources => 
      prevSources.map(source => 
        source.id === sourceId 
          ? { ...source, [field]: value, lastUpdated: Date.now() }
          : source
      )
    );
  };
  
  // Process reality fusion
  const processRealityFusion = async () => {
    if (!selectedAgent) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const agent = agents.find(a => a.id === selectedAgent);
      
      if (!agent) {
        throw new Error('Selected agent not found');
      }
      
      // Get connected sources
      const connectedSources = sources.filter(source => source.isConnected);
      
      if (connectedSources.length === 0) {
        throw new Error('No connected sources');
      }
      
      // Create prompt
      const sourcesText = connectedSources.map(source => 
        Source:  ()\n\n---
      ).join('\n');
      
      const prompt = You are , an AI agent with the following personality: .
      
You have access to the following reality sources:



Based on these reality sources, please:
1. Analyze the content
2. Extract key information
3. Provide insights or take actions based on this information
4. Explain how this information affects your understanding and decision-making

Respond in your unique voice as .;
      
      // Generate response
      const response = await generateCompletion({
        prompt,
        model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new'
      });
      
      setOutput(response.text);
    } catch (err) {
      console.error('Error processing reality fusion:', err);
      setError(Failed to process reality fusion: );
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className= flex justify-center items-center py-12>
        <div className=animate-spin rounded-full h-12 w-12 border-b-2 border-primary></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className=bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-6 rounded-lg>
        {error}
      </div>
    );
  }
  
  return (
    <div className=grid grid-cols-1 lg:grid-cols-3 gap-6>
      {/* Left Column - Reality Sources */}
      <div className=lg:col-span-1>
        <div className=bg-white dark:bg-gray-800 rounded-lg shadow-md p-4>
          <div className=flex justify-between items-center mb-4>
            <h2 className=text-xl font-semibold>Reality Sources</h2>
            <button
              className=text-primary hover:text-primary/80 flex items-center text-sm
              onClick={addNewSource}
            >
              <FiPlus className=mr-1 /> Add Source
            </button>
          </div>
          
          <div className=space-y-4>
            {sources.map(source => (
              <div key={source.id} className=border border-gray-200 dark:border-gray-700 rounded-lg p-3>
                <div className=flex justify-between items-start mb-2>
                  <div className=flex-1>
                    <input
                      type=text
                      value={source.name}
                      onChange={(e) => updateSource(source.id, 'name', e.target.value)}
                      className=font-semibold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary px-1 w-full
                    />
                    <div className=flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1>
                      <span className=capitalize>{source.type}</span>
                      <span className=mx-1></span>
                      <span>Updated {new Date(source.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className=flex space-x-1>
                    <button
                      className={p-1 rounded-md }
                      onClick={() => toggleSourceConnection(source.id)}
                      title={source.isConnected ? 'Disconnect' : 'Connect'}
                    >
                      <FiLink />
                    </button>
                    <button
                      className=p-1 text-red-500 hover:text-red-700 rounded-md
                      onClick={() => removeSource(source.id)}
                      title=Remove
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                
                {source.type === 'clipboard' && (
                  <div>
                    <div className=flex justify-between items-center mb-2>
                      <span className=text-xs font-medium>Clipboard Content</span>
                      <button
                        className=text-xs text-primary hover:text-primary/80 flex items-center
                        onClick={readClipboard}
                      >
                        <FiRefreshCw className=mr-1 /> Refresh
                      </button>
                    </div>
                    <textarea
                      value={source.content}
                      onChange={(e) => updateSource(source.id, 'content', e.target.value)}
                      className=w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary
                      rows={3}
                      placeholder=Click Refresh to read clipboard content
                    />
                  </div>
                )}
                
                {source.type === 'browser' && (
                  <div>
                    <div className=flex justify-between items-center mb-2>
                      <span className=text-xs font-medium>Browser Content</span>
                      <button
                        className=text-xs text-primary hover:text-primary/80 flex items-center
                        onClick={() => {
                          // In a real implementation, this would refresh the browser content
                          updateSource(source.id, 'content', 'This is updated browser tab content. In a real implementation, this would be the actual content of the current browser tab.');
                        }}
                      >
                        <FiRefreshCw className=mr-1 /> Refresh
                      </button>
                    </div>
                    <textarea
                      value={source.content}
                      onChange={(e) => updateSource(source.id, 'content', e.target.value)}
                      className=w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary
                      rows={3}
                      placeholder=Browser content will appear here
                    />
                  </div>
                )}
                
                {source.type === 'file' && (
                  <div>
                    <div className=flex justify-between items-center mb-2>
                      <span className=text-xs font-medium>File Content</span>
                      <button
                        className=text-xs text-primary hover:text-primary/80 flex items-center
                        onClick={() => {
                          // In a real implementation, this would open a file picker
                          updateSource(source.id, 'content', 'This is simulated file content. In a real implementation, this would be the actual content of the selected file.');
                        }}
                      >
                        <FiFile className=mr-1 /> Select File
                      </button>
                    </div>
                    <textarea
                      value={source.content}
                      onChange={(e) => updateSource(source.id, 'content', e.target.value)}
                      className=w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary
                      rows={3}
                      placeholder=File content will appear here
                    />
                  </div>
                )}
                
                {source.type === 'custom' && (
                  <div>
                    <div className=flex justify-between items-center mb-2>
                      <span className=text-xs font-medium>Custom Content</span>
                      <select
                        value={source.type}
                        onChange={(e) => updateSource(source.id, 'type', e.target.value as any)}
                        className=text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary
                      >
                        <option value=custom>Custom</option>
                        <option value=clipboard>Clipboard</option>
                        <option value=browser>Browser</option>
                        <option value=file>File</option>
                      </select>
                    </div>
                    <textarea
                      value={source.content}
                      onChange={(e) => updateSource(source.id, 'content', e.target.value)}
                      className=w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary
                      rows={3}
                      placeholder=Enter custom content here
                    />
                  </div>
                )}
                
                <div className=mt-2 flex items-center>
                  <div className={w-2 h-2 rounded-full mr-2 }></div>
                  <span className=text-xs>{source.isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            ))}
            
            {sources.length === 0 && (
              <div className=text-center py-8 bg-gray-100 dark:bg-gray-700 rounded-lg>
                <p className=text-gray-500 dark:text-gray-400>
                  No sources available. Add a source to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Column - Agent and Output */}
      <div className=lg:col-span-2>
        <div className=bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6>
          <h2 className=text-xl font-semibold mb-4>Agent Configuration</h2>
          
          <div className=mb-4>
            <label className=block text-sm font-medium mb-1>Select Agent</label>
            <select
              value={selectedAgent || ''}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className=w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary
            >
              <option value=>Select an agent</option>
 {agents.map(agent => (
 <option key={agent.id} value={agent.id}>{agent.name}</option>
 ))}
 </select>
 </div>
 
 {selectedAgent && (
 <div className=bg-gray-100 dark:bg-gray-700 p-3 rounded-md>
 <div className=flex items-start>
 <FiCpu className=mt-1 mr-2 text-primary />
 <div>
 <h3 className=font-medium>{agents.find(a => a.id === selectedAgent)?.name}</h3>
 <p className=text-sm text-gray-600 dark:text-gray-400>
 {agents.find(a => a.id === selectedAgent)?.personality?.substring(0, 100)}...
 </p>
 </div>
 </div>
 </div>
 )}
 
 <div className=mt-4 flex justify-between items-center>
 <div className=text-sm text-gray-500 dark:text-gray-400>
 {sources.filter(s => s.isConnected).length} sources connected
 </div>
 <button
 className=px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center
 onClick={processRealityFusion}
 disabled={isProcessing || !selectedAgent || sources.filter(s => s.isConnected).length === 0}
 >
 {isProcessing ? (
 <>
 <div className=animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2></div>
 Processing...
 </>
 ) : (
 <>
 <FiRefreshCw className=mr-2 /> Process Reality Fusion
 </>
 )}
 </button>
 </div>
 </div>
 
 <div className=bg-white dark:bg-gray-800 rounded-lg shadow-md p-4>
 <h2 className=text-xl font-semibold mb-4>Agent Output</h2>
 
 {output ? (
 <div className=bg-gray-100 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap>
 {output}
 </div>
 ) : (
 <div className=text-center py-12 bg-gray-100 dark:bg-gray-700 rounded-md>
 <p className=text-gray-500 dark:text-gray-400>
 Connect sources and process reality fusion to see output here.
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default RealityFusionInterface;
