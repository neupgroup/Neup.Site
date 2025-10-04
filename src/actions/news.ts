
'use server';

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  query,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

export interface NewsArticle {
    id: string;
    title: string;
    slug: string;
    content: string;
    author: string;
    imageUrl?: string;
    publishedAt: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

export async function createNewsArticle(data: Omit<NewsArticle, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    
    // Check if slug is unique
    const q = query(collection(firestore, 'news'), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return { success: false, error: `The slug "${slug}" is already in use.` };
    }

    const docRef = await addDoc(collection(firestore, 'news'), {
      ...data,
      slug,
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/news');
    revalidatePath(`/news/${slug}`);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: 'Failed to create news article.' };
  }
}

export async function getNewsArticles(): Promise<{ success: boolean; articles?: NewsArticle[]; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const querySnapshot = await getDocs(collection(firestore, 'news'));
        const articles = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                title: data.title,
                slug: data.slug,
                content: data.content,
                author: data.author,
                imageUrl: data.imageUrl,
                publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : null,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
            } as NewsArticle;
        });
        return { success: true, articles };
    } catch (error: any) {
        return { success: false, error: 'Failed to fetch news articles.' };
    }
}

export async function getNewsArticleBySlug(slug: string): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const q = query(collection(firestore, 'news'), where('slug', '==', slug), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'News article not found.' };
        }

        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        
        const article: NewsArticle = {
            id: docSnap.id,
            title: data.title,
            slug: data.slug,
            content: data.content,
            author: data.author,
            imageUrl: data.imageUrl,
            publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : null,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
        };
        return { success: true, article };

    } catch (error: any) {
        return { success: false, error: 'Failed to fetch news article.' };
    }
}

export async function updateNewsArticle(id: string, data: Partial<Omit<NewsArticle, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const articleRef = doc(firestore, 'news', id);
    
    const dataToSave: Record<string, any> = { ...data, updatedAt: serverTimestamp() };
    if(data.slug) {
        dataToSave.slug = slugify(data.slug);
    } else if (data.title) {
        // If title is changed but slug is not, update slug
        const currentDoc = await getDoc(articleRef);
        if (currentDoc.exists() && currentDoc.data().title !== data.title) {
           dataToSave.slug = slugify(data.title);
        }
    }

    await setDoc(articleRef, dataToSave, { merge: true });
    revalidatePath('/news');
    if (dataToSave.slug) {
      revalidatePath(`/news/${dataToSave.slug}`);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update news article.' };
  }
}

export async function deleteNewsArticle(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        await deleteDoc(doc(firestore, 'news', id));
        revalidatePath('/news');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Failed to delete news article.' };
    }
}
