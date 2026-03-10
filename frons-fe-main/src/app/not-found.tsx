import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          404 - Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          Sorry, the page you are looking for does not exist.
        </p>
        <Button>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
