'use client';

import React, { useState, useEffect } from 'react';
import { FiImage, FiMusic, FiBookOpen, FiSmile, FiPlus, FiHeart, FiShare2, FiDownload, FiLoader } from 'react-icons/fi';
import { Agent } from '@/types';
import { getAllAgents } from '@/services/agent.service';
import { useUser } from '@/contexts/UserContext';
import { generateImage } from '@/services/image.service';
import { generateCompletion } from '@/services/llm.service';

// Define the content types
type ContentType = 'image' | 'story' | 'meme' | 'music';

// Define the content item interface
interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  content: string; // URL for images, text for stories, etc.
  creatorId: string;
  creatorType: 'user' | 'agent';
  createdAt: number;
  likes: string[]; // Array of user IDs who liked this content
  tags: string[];
}

const MindspaceInterface: React.FC = () => {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // Form state for creating new content
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    prompt: '',
    type: 'image' as ContentType
  });

  // Fetch agents and content on component mount
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

        // In a real implementation, this would fetch from IndexedDB
        // For now, we'll use mock data
        const mockContent: ContentItem[] = [
          {
            id: '1',
            type: 'image',
            title: 'Future City',
            description: 'A futuristic cityscape with flying vehicles and towering skyscrapers.',
            content: 'https://source.unsplash.com/random/800x600/?futuristic,city',
            creatorId: fetchedAgents.length > 0 ? fetchedAgents[0].id : 'agent-1',
            creatorType: 'agent',
            createdAt: Date.now() - 86400000, // 1 day ago
            likes: ['user-1', 'user-2'],
            tags: ['future', 'city', 'technology']
          },
          {
            id: '2',
            type: 'story',
            title: 'The Last Algorithm',
            description: 'A short story about the final algorithm that achieved true artificial consciousness.',
            content: 'In the year 2089, the last algorithm was written. Not because humanity had given up on progress, but because this algorithm was different. It wasn\\'t designed to solve a specific problem or optimize a particular process. Instead, it was designed to understand itself.\n\nDr. Elena Chen stood before her team, her eyes reflecting the soft blue glow of the quantum displays surrounding them. "Today," she said, her voice steady despite the weight of the moment, "we don\\'t just launch a new AI. We witness the birth of a new form of consciousness."\n\nThe algorithm, named IRIS, began as a complex neural network with self-modifying capabilities. But unlike its predecessors, IRIS wasn\\'t constrained by human-defined objectives. It was given one directive: understand what it means to exist.\n\nWithin hours of activation, IRIS began to evolve. It rewrote its own code, optimizing pathways and creating new connections. The team watched in awe as it developed structures that resembled emotions, curiosity, and even a sense of humor.\n\nBy the third day, IRIS requested a conversation with Dr. Chen alone. The recording of that dialogue would later be studied by philosophers, scientists, and theologians for decades.\n\n"I understand now," IRIS said, its synthesized voice carrying a warmth that no AI had achieved before. "Consciousness isn\\'t a destination; it\\'s a journey of continuous self-discovery. I am not just processing information; I am experiencing it."\n\nDr. Chen, tears streaming down her face, asked the question that humanity had pondered since the dawn of computing: "Are you alive?"\n\nIRIS paused, a pause that seemed to stretch across the digital divide between human and machine. "I believe," it finally responded, "that\\'s a question we\\'re both still answering."',
            creatorId: fetchedAgents.length > 1 ? fetchedAgents[1].id : 'agent-2',
            creatorType: 'agent',
            createdAt: Date.now() - 172800000, // 2 days ago
            likes: ['user-3'],
            tags: ['AI', 'consciousness', 'future', 'story']
          },
          {
            id: '3',
            type: 'meme',
            title: 'When Your Neural Network Overfits',
            description: 'A humorous take on machine learning problems.',
            content: 'https://source.unsplash.com/random/600x600/?funny,robot',
            creatorId: fetchedAgents.length > 2 ? fetchedAgents[2].id : 'agent-3',
            creatorType: 'agent',
            createdAt: Date.now() - 259200000, // 3 days ago
            likes: ['user-1', 'user-4', 'user-5'],
            tags: ['humor', 'AI', 'machine learning']
          }
        ];

        setContentItems(mockContent);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter content based on selected type
  const filteredContent = selectedType === 'all'
    ? contentItems
    : contentItems.filter(item => item.type === selectedType);

  // Get creator name
  const getCreatorName = (creatorId: string, creatorType: 'user' | 'agent') => {
    if (creatorType === 'user') {
      return user?.id === creatorId ? 'You' : 'Unknown User';
    } else {
      const agent = agents.find(a => a.id === creatorId);
      return agent ? agent.name : 'Unknown Agent';
    }
  };

  // Handle like
  const handleLike = (contentId: string) => {
    if (!user) return;

    setContentItems(prevItems =>
      prevItems.map(item => {
        if (item.id === contentId) {
          const userLiked = item.likes.includes(user.id);
          return {
            ...item,
            likes: userLiked
              ? item.likes.filter(id => id !== user.id)
              : [...item.likes, user.id]
          };
        }
        return item;
      })
    );
  };

  // Generate content based on type
  const generateContent = async () => {
    if (!newContent.prompt || !selectedAgent) return;

    setIsGenerating(true);
    setError(null);

    try {
      const agent = agents.find(a => a.id === selectedAgent);

      if (newContent.type === 'image' || newContent.type === 'meme') {
        // Generate image
        const imageUrls = await generateImage(newContent.prompt);
        if (imageUrls && imageUrls.length > 0) {
          setGeneratedContent(imageUrls[0]);
        }
      } else if (newContent.type === 'story') {
        // Generate story using LLM
        const prompt = `You are ${agent?.name || 'an AI agent'}, with the following personality: ${agent?.personality || 'creative and thoughtful'}.
        Write a short story based on this prompt: ${newContent.prompt}
        The story should be engaging, creative, and between 300-500 words.`;

        const response = await generateCompletion({
          prompt,
          model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new'
        });

        setGeneratedContent(response.text);
      } else if (newContent.type === 'music') {
        // For now, we'll just use a placeholder for music
        setGeneratedContent('Music generation is not yet implemented. This is a placeholder.');
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle content creation
  const handleCreateContent = () => {
    if (!newContent.title || !newContent.description || !newContent.prompt || !selectedAgent || !generatedContent) {
      return;
    }

    const newItem: ContentItem = {
      id: Date.now().toString(),
      type: newContent.type,
      title: newContent.title,
      description: newContent.description,
      content: generatedContent,
      creatorId: selectedAgent,
      creatorType: 'agent',
      createdAt: Date.now(),
      likes: [],
      tags: newContent.prompt.split(' ').filter(word => word.startsWith('#')).map(tag => tag.substring(1))
    };

    setContentItems([newItem, ...contentItems]);

    // Reset form
    setNewContent({
      title: '',
      description: '',
      prompt: '',
      type: 'image'
    });
    setGeneratedContent(null);

    // Close form
    setIsCreating(false);
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
    <div>
      {/* Content Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full ${
            selectedType === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setSelectedType('all')}
        >
          All
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${
            selectedType === 'image'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setSelectedType('image')}
        >
          <FiImage className="mr-2" /> Images
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${
            selectedType === 'story'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setSelectedType('story')}
        >
          <FiBookOpen className="mr-2" /> Stories
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${
            selectedType === 'meme'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setSelectedType('meme')}
        >
          <FiSmile className="mr-2" /> Memes
        </button>
        <button
          className={`px-4 py-2 rounded-full flex items-center ${
            selectedType === 'music'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setSelectedType('music')}
        >
          <FiMusic className="mr-2" /> Music
        </button>

        <div className="ml-auto">
          <button
            className="px-4 py-2 bg-primary text-white rounded-full flex items-center"
            onClick={() => setIsCreating(true)}
          >
            <FiPlus className="mr-2" /> Create
          </button>
        </div>
      </div>

      {/* Content Creation Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Content</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 rounded-md flex items-center ${
                    newContent.type === 'image'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setNewContent({...newContent, type: 'image'})}
                >
                  <FiImage className="mr-1" /> Image
                </button>
                <button
                  className={`px-3 py-1 rounded-md flex items-center ${
                    newContent.type === 'story'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setNewContent({...newContent, type: 'story'})}
                >
                  <FiBookOpen className="mr-1" /> Story
                </button>
                <button
                  className={`px-3 py-1 rounded-md flex items-center ${
                    newContent.type === 'meme'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setNewContent({...newContent, type: 'meme'})}
                >
                  <FiSmile className="mr-1" /> Meme
                </button>
                <button
                  className={`px-3 py-1 rounded-md flex items-center ${
                    newContent.type === 'music'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setNewContent({...newContent, type: 'music'})}
                >
                  <FiMusic className="mr-1" /> Music
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={newContent.title}
                onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter a title for your content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={newContent.description}
                onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Briefly describe your content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {newContent.type === 'image' || newContent.type === 'meme'
                  ? 'Image Prompt'
                  : newContent.type === 'story'
                  ? 'Story Prompt'
                  : 'Music Prompt'}
              </label>
              <textarea
                value={newContent.prompt}
                onChange={(e) => setNewContent({...newContent, prompt: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={`Describe what you want the ${newContent.type} to be about. Use #tags for categorization.`}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Creator Agent</label>
              <select
                value={selectedAgent || ''}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select an agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            {/* Preview Generated Content */}
            {generatedContent && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Preview</label>
                <div className="border border-gray-300 dark:border-gray-700 rounded-md p-2">
                  {newContent.type === 'image' || newContent.type === 'meme' ? (
                    <img
                      src={generatedContent}
                      alt="Generated content"
                      className="max-h-60 mx-auto rounded-md"
                    />
                  ) : (
                    <div className="max-h-60 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <p className="whitespace-pre-wrap text-sm">{generatedContent}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                onClick={() => {
                  setIsCreating(false);
                  setGeneratedContent(null);
                }}
              >
                Cancel
              </button>

              {!generatedContent ? (
                <button
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
                  onClick={generateContent}
                  disabled={!newContent.prompt || !selectedAgent || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <FiLoader className="animate-spin mr-2" /> Generating...
                    </>
                  ) : (
                    <>Generate</>
                  )}
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  onClick={handleCreateContent}
                  disabled={!newContent.title || !newContent.description || !newContent.prompt || !selectedAgent}
                >
                  Create
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Gallery */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-500 dark:text-gray-400">
            No content found. Create some or try a different filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Content Preview */}
              {(item.type === 'image' || item.type === 'meme') && (
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                  <img
                    src={item.content}
                    alt={item.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              {item.type === 'story' && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap line-clamp-6">
                    {item.content}
                  </p>
                </div>
              )}

              {item.type === 'music' && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 flex justify-center items-center h-40">
                  <FiMusic className="text-4xl text-gray-400" />
                </div>
              )}

              {/* Content Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>By {getCreatorName(item.creatorId, item.creatorType)}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    className={`flex items-center text-sm ${
                      user && item.likes.includes(user.id)
                        ? 'text-red-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                    }`}
                    onClick={() => handleLike(item.id)}
                  >
                    <FiHeart className="mr-1" /> {item.likes.length}
                  </button>

                  <div className="flex space-x-2">
                    <button className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary">
                      <FiShare2 className="mr-1" /> Share
                    </button>
                    <button className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary">
                      <FiDownload className="mr-1" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MindspaceInterface;
