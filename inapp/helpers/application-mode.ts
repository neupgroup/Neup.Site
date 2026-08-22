/*
::neup.documentation::inapp-helper-application-mode
::title Application Mode Helper

Keeps application mode query parameters attached to navigation URLs when the current route is operating in root mode.

::public

Use `appendApplicationRootMode()` when building an in-app URL that should preserve `mode=root` from the current request or browser URL.

::public end

::private

This helper lives in `inapp/helpers` for in-app navigation surfaces that need to preserve root-mode query state.

::private end

::end
*/

export function appendApplicationRootMode(targetHref: string, mode: string | null): string {
  if (mode !== 'root') {
    return targetHref;
  }

  const [basePath, existingQuery = ''] = targetHref.split('?');
  const params = new URLSearchParams(existingQuery);

  if (!params.has('mode')) {
    params.set('mode', mode);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function appendSelectedProject(targetHref: string, selectedProject: string | null): string {
  if (!selectedProject) {
    return targetHref;
  }

  const [basePath, existingQuery = ''] = targetHref.split('?');
  const params = new URLSearchParams(existingQuery);

  if (!params.has('selectedProject')) {
    params.set('selectedProject', selectedProject);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
