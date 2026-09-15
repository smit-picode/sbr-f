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
    <div className="relative flex items-center">
      <Search className="absolute start-4 h-4 w-4 text-slate-400 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`ps-10 pe-9 w-80 focus:border-[#8A1538]/40 focus:ring-[#8A1538]/20 ${className ?? ''}`}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-0 h-10 w-10 rounded-full"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4 text-slate-400" />
        </Button>
      )}
    </div>
  );
}
