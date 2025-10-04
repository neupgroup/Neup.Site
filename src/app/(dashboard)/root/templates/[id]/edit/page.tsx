
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  useEffect(() => {
    const { id } = params;
    redirect(`/root/templates/${id}/edit/basics`);
  }, [params]);

  return null;
}
