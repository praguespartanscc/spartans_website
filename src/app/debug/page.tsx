'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState({
    supabaseUrl: '',
    supabaseAnonKey: ''
  });

  useEffect(() => {
    // Get the environment variables from the window object
    setEnvVars({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Key exists (value hidden)' : 'Not found'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-[#1a3049]">Environment Debug Page</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Supabase Environment Variables</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="mb-2"><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {envVars.supabaseUrl}</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {envVars.supabaseAnonKey}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>If you see &quot;Not found&quot; for either variable, your environment variables are not being loaded correctly.</li>
            <li>Make sure your .env.local file exists in the root directory and has the correct format.</li>
            <li>Restart your Next.js development server after making changes to the .env.local file.</li>
            <li>Make sure there are no spaces around the equal sign in your .env file: <code>VARIABLE=value</code></li>
          </ul>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
          <p>
            If your environment variables are not showing up, try these steps:
          </p>
          <ol className="list-decimal pl-6 mt-2 space-y-2">
            <li>Double-check your .env.local file for typos</li>
            <li>Make sure the file is saved in the root directory of your project</li>
            <li>Stop your development server completely and restart it</li>
            <li>Try running <code>npm run build</code> and then <code>npm start</code> instead of development mode</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 