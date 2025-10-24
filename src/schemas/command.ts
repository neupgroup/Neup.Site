
import { z } from 'zod';

export const commandParameterSchema = z.object({
    key: z.string().min(1, 'Parameter key is required.'),
    label: z.string().min(1, 'Parameter label is required.'),
    type: z.enum(['string', 'number']),
    defaultValue: z.string().optional(),
    confidential: z.boolean().optional(),
});

export const serverCommandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Command name is required.'),
  description: z.string().optional(),
  commandTemplate: z.string().min(1, 'Command template is required.'),
  parameters: z.array(commandParameterSchema).optional(),
  preprocess: z.boolean().default(false),
  allocatesPort: z.boolean().optional().default(false),
  portToReserve: z.string().optional(),
  type: z.enum(['creation', 'destruction', 'updation', 'view']).default('view'),
  danger: z.enum(['low', 'mid', 'high']).default('low'),
  createdAt: z.string().optional().nullable(),
});

export type ServerCommand = z.infer<typeof serverCommandSchema>;
export type CommandParameter = z.infer<typeof commandParameterSchema>;
