import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface EmptyManuscriptsStateProps {
  onSubmitManuscript: () => void;
  variant?: "overview" | "manuscripts";
}

export function EmptyManuscriptsState({
  onSubmitManuscript,
  variant = "overview",
}: EmptyManuscriptsStateProps) {
  if (variant === "overview") {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-primary mb-2">
          No Submissions Yet
        </h3>
        <p className="text-muted-foreground mb-6">
          Start your academic journey by submitting your first manuscript.
        </p>
        <Button onClick={onSubmitManuscript} size="lg">
          <PlusIcon className="h-4 w-4 mr-2" />
          Submit Your First Manuscript
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <h3 className="text-xl font-semibold text-primary mb-2">
        No Manuscripts Yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        You have not submitted any manuscripts yet. Start by submitting your
        first research paper.
      </p>
      <Button onClick={onSubmitManuscript} size="lg">
        <PlusIcon className="h-4 w-4 mr-2" />
        Submit Your First Manuscript
      </Button>
    </div>
  );
}
