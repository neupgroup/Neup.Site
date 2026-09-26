import { getForms } from '@/services/forms';
import SubmissionForm from './submission-form';

export default async function NewSubmissionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const forms = await getForms();
  const project = typeof query.project === 'string' ? query.project : null;
  return <SubmissionForm project={project} forms={forms.map((form) => ({ id: form.id, name: form.name, fields: form.fields }))} />;
}
