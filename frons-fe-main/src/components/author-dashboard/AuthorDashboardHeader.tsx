import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface AuthorDashboardHeaderProps {
  onNewSubmission: () => void;
}

export function AuthorDashboardHeader({ onNewSubmission }: AuthorDashboardHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Author Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your research submissions and track publication progress
          </p>
        </div>
        <Button
          onClick={onNewSubmission}
          size="lg"
          className="hidden md:flex"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Submission
        </Button>
      </div>
    </div>
  );
}