
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
      <main>
        {children}
      </main>
    </div>
  );
}
