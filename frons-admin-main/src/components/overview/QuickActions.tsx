import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { type ManuscriptStats } from "@/hooks/useOverview";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  isPrimary?: boolean;
  badge?: string;
}

interface QuickActionsProps {
  manuscriptStats: ManuscriptStats;
}

export function QuickActions({ manuscriptStats }: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      title: "Submit Manuscript",
      description: "Upload and submit a new research manuscript",
      href: "/submit-manuscript",
      isPrimary: true,
    },
    {
      title: "Review Manuscripts",
      description: "Browse manuscripts available for peer review",
      href: "/review-manuscript",
      badge: `${manuscriptStats.pendingReviews} available`,
    },
    {
      title: "Research Trends",
      description: "Explore trending research topics and analytics",
      href: "/research-trends",
    },
    {
      title: "DOCI Tracker",
      description: "Manage your research NFT certificates",
      href: "/doci-tracker",
    },
    {
      title: "Researcher Profiles",
      description: "Connect with other researchers in your field",
      href: "/researcher-profiles",
    },
    {
      title: "DAO Proposals",
      description: "(Coming Soon)",
      href: "/",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quickActions.map((action, index) => (
        <Card
          key={index}
          className={`group hover:shadow-md transition-all duration-200 ${
            action.isPrimary
              ? "ring-2 ring-primary/20 bg-primary/5"
              : "bg-white/80"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {action.description}
                </p>
              </div>
              {action.badge && (
                <Badge
                  variant="secondary"
                  className="text-xs ml-2 flex-shrink-0"
                >
                  {action.badge}
                </Badge>
              )}
            </div>
            <Button
              variant={action.isPrimary ? "default" : "outline"}
              size="sm"
              className="w-full group"
              asChild
            >
              <Link href={action.href}>
                <span>Get Started</span>
                <ArrowRightIcon className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
