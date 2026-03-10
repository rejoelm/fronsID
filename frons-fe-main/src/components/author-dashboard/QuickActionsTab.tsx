import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCwIcon, EyeIcon } from "lucide-react";

interface QuickActionsTabProps {
  onNewSubmission: () => void;
  onRefreshStatus: () => void;
  onViewProfile: () => void;
}

export function QuickActionsTab({ 
  onNewSubmission, 
  onRefreshStatus, 
  onViewProfile 
}: QuickActionsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary mb-2">
          Quick Actions
        </h3>
        <p className="text-muted-foreground mb-6">
          Manage your submissions and profile efficiently
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={onNewSubmission}
          className="h-20 flex-col space-y-2"
          size="lg"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Submission</span>
        </Button>
        <Button
          variant="outline"
          onClick={onRefreshStatus}
          className="h-20 flex-col space-y-2 bg-transparent"
          size="lg"
        >
          <RefreshCwIcon className="h-5 w-5" />
          <span>Refresh Status</span>
        </Button>
        <Button
          variant="outline"
          onClick={onViewProfile}
          className="h-20 flex-col space-y-2"
          size="lg"
        >
          <EyeIcon className="h-5 w-5" />
          <span>View Profile</span>
        </Button>
      </div>
    </div>
  );
}