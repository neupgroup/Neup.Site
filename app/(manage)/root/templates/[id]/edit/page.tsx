
'use client';

import { useEffect, use } from 'react';
import { redirect } from 'next/navigation';

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  useEffect(() => {
    redirect(`/root/templates/${id}/edit/basics`);
  }, [id]);

  return null;
}
