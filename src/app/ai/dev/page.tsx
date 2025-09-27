'use client';
import { GenkitDev } from 'genkit/dev';
import 'genkit/dev/style.css';
import { dev } from '../../../ai/dev';

export default function DevPage() {
  return <GenkitDev dev={dev} />;
}
