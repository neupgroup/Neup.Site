
'use client';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, File, Folder, HardDrive, ListTree, Wifi } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const serverNavItems = [
    { name: 'Storage', href: 'storage', icon: HardDrive },
    { name: 'Network', href: 'network', icon: Wifi },
    { name: 'Processes', href: 'processes', icon: ListTree },
    { name: 'PM2', href: 'pm2', icon: ListTree },
    { name: 'File Manager', href: 'files', icon: Folder },
];

export default function ServerStatusLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();

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

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        <aside>
            <nav className="flex flex-col gap-1">
                {serverNavItems.map(item => {
                    const href = `/root/servers/${params.id}/${item.href}`;
                    const isActive = pathname === href;
                    return (
                        <Link key={item.href} href={href}>
                            <span className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            )}>
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
