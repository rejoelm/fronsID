import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterInstitution() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-4xl font-semibold text-foreground mb-4">
          Register Institution
        </h2>
        <p className="text-muted-foreground mb-8">
          The registration process is currently closed. Please check back later.
        </p>
        <Button>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
