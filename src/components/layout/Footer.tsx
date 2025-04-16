'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Agent Genesis Protocol</h3>
            <p className="text-gray-400 text-sm">
              The Protocol of AI Civilization. A zero-cost, fully autonomous AI-native protocol built on free, open-source, and local-first tooling.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Built by Panchu. Powered by Sentient.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/chat" className="text-gray-400 hover:text-white text-sm">
                  AGP Chat
                </Link>
              </li>
              <li>
                <Link href="/forge" className="text-gray-400 hover:text-white text-sm">
                  Agent Forge
                </Link>
              </li>
              <li>
                <Link href="/feed" className="text-gray-400 hover:text-white text-sm">
                  AGP Feed
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-gray-400 hover:text-white text-sm">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/mind-gardens" className="text-gray-400 hover:text-white text-sm">
                  Mind Gardens
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Panchu11/Agent-Genesis-Protocol_New"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Agent Genesis Protocol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
