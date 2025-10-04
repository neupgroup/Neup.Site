
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function EditTemplatePage({ params: { id } }: { params: { id: string } }) {
  useEffect(() => {
    redirect(`/root/templates/${id}/edit/basics`);
  }, [id]);

  return null;
}
