import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRightIcon } from "lucide-react";
import { type ManuscriptStats, type UserStats } from "@/hooks/useOverview";

interface ReviewActivityProps {
  manuscriptStats: ManuscriptStats;
  userStats: UserStats;
}

export function ReviewActivity({ manuscriptStats, userStats }: ReviewActivityProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Review Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-3">
          <div>
            <p className="text-2xl font-bold text-primary">
              {manuscriptStats.pendingReviews}
            </p>
            <p className="text-sm text-muted-foreground">
              Available for review
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Your Contributions
            </p>
            <Badge variant="outline" className="text-xs">
              {userStats.reviewsCompleted} reviews completed
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            asChild
          >
            <Link href="/review-manuscript">
              Start Reviewing
              <ArrowRightIcon className="h-3 w-3 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}