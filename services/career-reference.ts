export function careerReference(slug: string, id: string) {
  return `${slug}--${id}`;
}

export function parseCareerReference(reference: string) {
  const separatorIndex = reference.lastIndexOf('--');
  if (separatorIndex <= 0 || separatorIndex === reference.length - 2) {
    return null;
  }

  return {
    slug: reference.slice(0, separatorIndex),
    id: reference.slice(separatorIndex + 2),
  };
}
