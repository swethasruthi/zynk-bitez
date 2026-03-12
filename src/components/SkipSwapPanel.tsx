import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, SkipForward, RefreshCw, Undo2 } from 'lucide-react';

type AlternativeOption = { id: string; name: string };

interface SkipSwapPanelProps {
  isSkipped: boolean;
  isLocked: boolean;
  cutoffLabel: string;
  alternatives: AlternativeOption[];
  onSkip: () => void;
  onUnskip: () => void;
  onSwap: (mealId: string) => void;
}

export const SkipSwapPanel = ({
  isSkipped,
  isLocked,
  cutoffLabel,
  alternatives,
  onSkip,
  onUnskip,
  onSwap,
}: SkipSwapPanelProps) => {
  const hasAlternatives = alternatives.length > 0;

  return (
    <div className="rounded-xl border border-border/50 p-3 bg-white/70">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Skip or Keep</p>
        {isLocked && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="w-3 h-3" />
            Confirmed by {cutoffLabel}
          </Badge>
        )}
      </div>

      {!isLocked && (
        <div className="flex flex-wrap gap-2">
          {isSkipped ? (
            <Button variant="outline" onClick={onUnskip}>
              <Undo2 className="w-4 h-4 mr-2" />
              Keep Meal
            </Button>
          ) : (
            <Button variant="outline" onClick={onSkip}>
              <SkipForward className="w-4 h-4 mr-2" />
              Skip Meal
            </Button>
          )}

          {hasAlternatives && !isSkipped && (
            <select
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
              onChange={(e) => e.target.value && onSwap(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Swap with...</option>
              {alternatives.map((alt) => (
                <option key={alt.id} value={alt.id}>{alt.name}</option>
              ))}
            </select>
          )}

          {!hasAlternatives && !isSkipped && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              No swap alternatives available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
