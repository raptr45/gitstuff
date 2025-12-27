'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface FollowerTrackerFormProps {
  onSubmit: (username: string) => void;
  isLoading: boolean;
}

export function FollowerTrackerForm({ onSubmit, isLoading }: FollowerTrackerFormProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!username.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    setError('');
    onSubmit(username.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter GitHub username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            disabled={isLoading}
            className="w-full"
            aria-label="GitHub username"
            aria-invalid={!!error}
            aria-describedby={error ? 'username-error' : undefined}
          />
          {error && (
            <p id="username-error" className="text-sm text-red-500 mt-1">
              {error}
            </p>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading}
          aria-label="Search for GitHub user"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
