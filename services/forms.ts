'use server';

import { prisma as db } from '@neup/core/database/prisma';
import { revalidatePath } from 'next/cache';
import { getActiveProjectId } from '@/services/projects';
import { slugify } from '@neup/core/helpers/slug';

export type FormField = { name: string; label: string; type: string; required?: boolean };

export async function getForms() {
  const projectId = await getActiveProjectId({ required: true });
  return db.form.findMany({ where: { projectId: projectId! }, orderBy: { createdOn: 'desc' } });
}

export async function getFormBySlug(slug: string) {
  const projectId = await getActiveProjectId({ required: true });
  return db.form.findFirst({ where: { projectId: projectId!, slug } });
}

export async function getFormSubmissions() {
  const projectId = await getActiveProjectId({ required: true });
  return db.formSubmission.findMany({ where: { projectId: projectId! }, include: { form: true }, orderBy: { postedOn: 'desc' } });
}

export async function getFormSubmission(id: string) {
  const projectId = await getActiveProjectId({ required: true });
  return db.formSubmission.findFirst({ where: { id, projectId: projectId! }, include: { form: true } });
}

export async function createForm(input: { name: string; slug: string; fields: FormField[] }) {
  const projectId = await getActiveProjectId({ required: true });
  const name = input.name.trim();
  if (!name || !Array.isArray(input.fields) || input.fields.length === 0) return { success: false, error: 'Name and at least one field are required.' };
  const slug = slugify(input.slug || name, 'form').toLowerCase();
  const form = await db.form.create({ data: { projectId: projectId!, name, slug, fields: input.fields } });
  revalidatePath('/inbox/forms');
  revalidatePath('/inbox');
  return { success: true, id: form.id };
}

export async function createFormSubmission(projectId: string, formId: string, response: Record<string, unknown>) {
  if (!projectId || !formId || !response || Array.isArray(response) || typeof response !== 'object') throw new Error('Invalid submission payload.');
  const form = await db.form.findFirst({ where: { id: formId, projectId } });
  if (!form) throw new Error('Form not found.');
  const fields = Array.isArray(form.fields) ? form.fields as FormField[] : [];
  for (const field of fields) {
    if (!field || typeof field.name !== 'string' || !field.name.trim()) throw new Error('Form configuration is invalid.');
    if (field.required && (response[field.name] === undefined || response[field.name] === null || String(response[field.name]).trim() === '')) throw new Error(`Missing required field: ${field.name}`);
  }
  return db.formSubmission.create({ data: { projectId, formId, response: response as any, status: 'new' }, select: { id: true, postedOn: true } });
}

export async function createActiveFormSubmission(formId: string, response: Record<string, unknown>) {
  const projectId = await getActiveProjectId({ required: true });
  const result = await createFormSubmission(projectId!, formId, response);
  revalidatePath('/inbox');
  return result;
}
