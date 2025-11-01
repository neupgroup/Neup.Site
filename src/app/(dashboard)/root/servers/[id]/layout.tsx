
'use client';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ServerStatusLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {

  return (
    <div className="w-full space-y-6">
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href={`/root/servers/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Server
          </Link>
        </Button>
      </div>
      <main>
        {children}
      </main>
    </div>
  );
}
