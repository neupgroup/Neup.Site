
import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardFooter,
} from '@/components/ui/card';

export default function EditTemplateLayout({ children, params }: { children: ReactNode, params: { id: string } }) {
  const { id } = params;

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="mb-4">
        <Button variant="ghost" asChild>
            <Link href="/root/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
            </Link>
        </Button>
      </div>

      {children}

    </div>
  );
}
