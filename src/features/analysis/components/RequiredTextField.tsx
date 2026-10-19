'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/utils/toast';

interface Props {
  value: string;
  onCommit: (value: string) => void;
  ariaLabel: string;
  requiredMessage: string;
  className: string;
  invalidClassName: string;
  placeholder?: string;
  maxLength?: number;
  wrap?: boolean;
}

// An empty value is never committed; leaving the field empty restores the last saved text.
export function RequiredTextField({ value, onCommit, ariaLabel, requiredMessage, className, invalidClassName, placeholder, maxLength, wrap = false }: Props) {
  const [draft, setDraft] = useState(value);
  const [edited, setEdited] = useState(false);
  const focused = useRef(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const invalid = edited && !draft.trim();

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  useLayoutEffect(() => {
    if (!wrap || !area.current) return;
    area.current.style.height = 'auto';
    area.current.style.height = `${area.current.scrollHeight}px`;
  }, [draft, wrap]);

  const change = (next: string) => {
    setDraft(next);
    setEdited(true);
    if (next.trim()) onCommit(next);
  };

  const leave = () => {
    focused.current = false;
    setEdited(false);
    if (draft.trim() || !value.trim()) return;
    setDraft(value);
    toast.error(requiredMessage);
  };

  const shared = {
    value: draft,
    placeholder,
    maxLength,
    'aria-label': ariaLabel,
    'aria-invalid': invalid,
    onFocus: () => { focused.current = true; },
    onBlur: leave,
    className: cn(className, invalid && invalidClassName),
  };

  if (wrap) {
    return (
      <textarea
        {...shared}
        ref={area}
        rows={1}
        onChange={(e) => change(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
        className={cn(shared.className, 'block resize-none overflow-hidden')}
      />
    );
  }

  return <input {...shared} onChange={(e) => change(e.target.value)} />;
}
