
'use client';

export default function ServerStatusLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="w-full space-y-6">
      <main>
        {children}
      </main>
    </div>
  );
}
