'use client';

import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  loading = false,
}: SearchInputProps) {
  return (
    <div className="relative flex items-center">
      {loading ? (
        <Loader2 className="absolute start-4 h-4 w-4 animate-spin text-[#A29374] pointer-events-none" />
      ) : (
        <Search className="absolute start-4 h-4 w-4 text-slate-400 pointer-events-none" />
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`ps-10 pe-9 w-80 focus:border-[#A29374]/40 focus:ring-[#A29374]/20 ${className ?? ''}`}
      />
      {value && !loading && (
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
