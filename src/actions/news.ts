
'use server';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { logErrorToFirestore } from '@/lib/logging';

export interface NewsArticle {
    id: string;
    title: string;
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

export async function createNewsArticle(data: Partial<Omit<NewsArticle, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt'>> & { title: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    
    const slug = slugify(data.title);
    const randomId = Math.random().toString(36).substring(2, 8);
    const id = `${slug}-${randomId}`;

    const newArticleRef = doc(firestore, 'news', id);

    await setDoc(newArticleRef, {
      title: data.title,
      author: data.author || 'Author Name',
      content: data.content || '<p>Start writing your article here...</p>',
      imageUrl: data.imageUrl || '',
      id,
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/news');
    revalidatePath(`/news/${id}`);
    return { success: true, id: id };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to create news article: ${e.message}`, stack: e.stack, source: 'createNewsArticle' });
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
                content: data.content,
                author: data.author,
                imageUrl: data.imageUrl,
                publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : null,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
            } as NewsArticle;
        });
        return { success: true, articles };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get news articles: ${e.message}`, stack: e.stack, source: 'getNewsArticles' });
        return { success: false, error: 'Failed to fetch news articles.' };
    }
}

export async function getNewsArticleById(id: string): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'news', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'News article not found.' };
        }

        const data = docSnap.data();
        
        const article: NewsArticle = {
            id: docSnap.id,
            title: data.title,
            content: data.content,
            author: data.author,
            imageUrl: data.imageUrl,
            publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : null,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
        };
        return { success: true, article };

    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get news article ${id}: ${e.message}`, stack: e.stack, source: 'getNewsArticleById' });
        return { success: false, error: 'Failed to fetch news article.' };
    }
}

export async function updateNewsArticle(id: string, data: Partial<Omit<NewsArticle, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const articleRef = doc(firestore, 'news', id);
    
    const dataToSave: Record<string, any> = { ...data, updatedAt: serverTimestamp() };

    await setDoc(articleRef, dataToSave, { merge: true });
    revalidatePath('/news');
    revalidatePath(`/news/${id}`);
    
    return { success: true };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to update news article ${id}: ${e.message}`, stack: e.stack, source: 'updateNewsArticle' });
    return { success: false, error: 'Failed to update news article.' };
  }
}

export async function deleteNewsArticle(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        await deleteDoc(doc(firestore, 'news', id));
        revalidatePath('/news');
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to delete news article ${id}: ${e.message}`, stack: e.stack, source: 'deleteNewsArticle' });
        return { success: false, error: 'Failed to delete news article.' };
    }
}
