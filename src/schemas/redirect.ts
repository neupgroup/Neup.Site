
import { z } from 'zod';

export const redirectSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  from: z.string().min(1, 'The "from" path is required.'),
  to: z.string().url({ message: "The 'to' field must be a valid URL." }),
  type: z.enum(['temporary', 'permanent']),
  created_by: z.string(),
  created_on: z.string().nullable(),
});

export type Redirect = z.infer<typeof redirectSchema>;
