import { Sparkles, BookOpen, FileText, Brain, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
}

const QuickPrompts = ({ onSelect }: QuickPromptsProps) => {
  const prompts = [
    {
      icon: <Sparkles className="h-4 w-4" />,
      text: "Summarize my recent notes",
      query: "Can you summarize my most recent notes and highlight the key points?"
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      text: "Important questions",
      query: "What are the most important questions I should focus on for my upcoming exams?"
    },
    {
      icon: <FileText className="h-4 w-4" />,
      text: "Upload notes",
      query: "I want to upload some new notes. Can you help me organize them?"
    },
    {
      icon: <Brain className="h-4 w-4" />,
      text: "Study plan",
      query: "Can you create a study plan based on my notes and upcoming exams?"
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      text: "Revision schedule",
      query: "Help me create a revision schedule for my upcoming exams."
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {prompts.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-primary/10"
          onClick={() => onSelect(prompt.query)}
        >
          {prompt.icon}
          {prompt.text}
        </Button>
      ))}
    </div>
  );
};

export default QuickPrompts; 