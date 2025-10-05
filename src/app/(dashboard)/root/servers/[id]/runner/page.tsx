
'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function runCommand(serverId: string, command: string) {
    const createResult = await createServerLog({
        serverId: serverId,
        command,
        output: `Initiating command...`,
        status: 'pending',
    });

    if (!createResult.success || !createResult.id) {
        console.error('Failed to create log entry for command:', command);
        return;
    }
    const logId = createResult.id;

    revalidatePath(`/root/servers/${serverId}`);

    // Simulate starting the command after a short delay
    setTimeout(async () => {
        await updateServerLog(logId, { status: 'ongoing', output: `Running: ${command}\n...` });
        revalidatePath(`/root/servers/${serverId}`);
    }, 1500);

    // Simulate command completion after a longer delay
    setTimeout(async () => {
      const isSuccess = Math.random() > 0.1; // 90% success rate
      const finalStatus = isSuccess ? 'completed' : 'failed';
      const finalOutput = isSuccess
        ? `Running: ${command}\n...\nFake process output line 1...\nFake process output line 2...\nTask finished successfully.`
        : `Running: ${command}\n...\nError: Something went wrong during execution.\nPermission denied (fake error).`;

      await updateServerLog(logId, {
        status: finalStatus,
        output: finalOutput,
      });
      revalidatePath(`/root/servers/${serverId}`);
    }, 5000);
}

// This function will be called via a form POST
export default async function RunnerPage({ params, request }: { params: { id: string }, request: Request }) {
    const { id } = params;
    const formData = await request.formData();
    const command = formData.get('command') as string;

    if (command) {
        await runCommand(id, command);
    }
    
    // Always redirect back after handling the action
    redirect(`/root/servers/${id}`);
}
