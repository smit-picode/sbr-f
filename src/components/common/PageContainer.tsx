import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300', className)}>
      {children}
    </div>
  );
}
