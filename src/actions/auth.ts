
'use server'

import { cookies } from 'next/headers'
 
export async function setSiteIdCookie(siteId: string) {
  cookies().set('siteId', siteId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
  })
}
