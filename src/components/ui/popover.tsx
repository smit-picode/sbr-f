'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

// Same family as Select/DropdownMenu. Nested in a Dialog, this still needs the `container` prop
// (see PopoverContentProps below, and useNearestDialogContainer) — without it, Portal renders to
// document.body, a SIBLING of the Dialog's own content in the DOM, and the Dialog's FocusScope
// (which only recognizes its own descendants as "inside") fights this popover for focus on every
// click/keystroke: confirmed live with Playwright — a real click on content inside an
// un-contained popover here never moved document.activeElement off the Dialog's last-focused
// element, so typing produced nothing. Passing the Dialog's content node as `container` makes
// this content a genuine DOM descendant of it, resolving the conflict at the root instead of
// fighting it with onOpenAutoFocus/onFocusOutside overrides (which alone were not enough).
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  // Forwarded to the underlying Portal. Passing the nearest Dialog's own content node (see
  // useNearestDialogContainer) makes this content a genuine DOM descendant of that Dialog instead
  // of a sibling portaled to document.body — see popover.tsx's own top note for why that matters.
  // Omit for a Popover that isn't nested in a Dialog; Portal defaults to document.body.
  container?: HTMLElement | null;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = 'start', sideOffset = 4, collisionPadding = 8, container, ...props }, ref) => (
  <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        'z-50 rounded-2xl border border-slate-200 bg-white shadow-float outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
