
import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function runCommand(serverId: string, command: string) {
    'use server';

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

    // Revalidate the server detail page to show the pending log immediately
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

export default async function RunnerPage({ params, searchParams }: { params: { id: string }, searchParams: { command?: string } }) {
    const { id } = params;

    // This check is for POST requests from forms
    if (searchParams && typeof searchParams === 'object') {
        const formData = searchParams as unknown as FormData;
        const command = formData.get('command') as string;
        if (command) {
            await runCommand(id, command);
        }
    }
    
    // Always redirect back after handling the action or if accessed directly
    redirect(`/root/servers/${id}`);
}
