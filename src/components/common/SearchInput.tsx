'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className ?? ''}`}>
      <Search className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8 w-80"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 h-9 w-9"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4 text-slate-400" />
        </Button>
      )}
    </div>
  );
}
