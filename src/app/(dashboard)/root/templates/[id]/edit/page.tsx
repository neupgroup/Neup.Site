
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  useEffect(() => {
    redirect(`/root/templates/${params.id}/edit/basics`);
  }, [params.id]);

  return null;
}
