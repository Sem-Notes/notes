import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

const TypingIndicator = ({ className }: TypingIndicatorProps) => {
  return (
    <div className={cn('flex gap-1 p-2', className)}>
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
      </div>
    </div>
  );
};

export default TypingIndicator; 