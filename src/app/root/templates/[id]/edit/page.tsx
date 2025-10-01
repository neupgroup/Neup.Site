
import { redirect } from 'next/navigation';

export default function EditTemplateRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/root/templates/${params.id}/edit/basics`);
  
  // This will not be rendered as the user is redirected.
  return null;
}
