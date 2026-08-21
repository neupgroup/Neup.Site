'use client';

/*
::neup.documentation::manage-site-profile-route

::public

Dedicated `/site/profile` route for the manage dashboard. Reuses the existing
profile settings screen so the header account link lands on a stable,
direct profile page without duplicating profile-editing logic.

::public end
::end
*/

export { default } from '@/app/(manage)/settings/profile/page';
