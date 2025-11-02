
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
    <code className="font-mono">{children}</code>
  </pre>
);

export default function CommandsGuidePage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
       <Button asChild variant="ghost" className="pl-0">
          <Link href="/root/command">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commands
          </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-6 w-6" />
            Server Command Guide
          </CardTitle>
          <CardDescription>
            Learn how to create powerful and reusable command templates for your servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="pre-processor">Pre-Processor</TabsTrigger>
            </TabsList>
            <TabsContent value="basics" className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">Command Structure</h3>
              <p>
                Commands are composed of two main parts wrapped in an XML-like structure. This allows for both pre-processing logic and the final bash script to be defined in one place.
              </p>
              <CodeBlock>
{`<javascript.preProcessor>
  // Optional: JavaScript code that runs on our server before the command.
  // Use it to prepare parameters.
</javascript.preProcessor>

<server.ubuntuBashProcessor>
  # The main shell script that runs on your target server.
  echo "Hello, {{name}}!"
</server.ubuntuBashProcessor>`}
              </CodeBlock>
              <p>
                Placeholders like `{{name}}` are automatically detected and will create input fields on the command execution form.
              </p>
            </TabsContent>

            <TabsContent value="variables" className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">Universal Variables</h3>
              <p>
                You can use a set of built-in "universal" variables in both the pre-processor (as `universal.variableName`) and the bash script (`{{universal.variableName}}`).
              </p>
               <Alert>
                <Globe className="h-4 w-4" />
                <AlertTitle>Available Universal Variables</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.server_name}}`}</code> - Server name</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.server_publicIp}}`}</code> - Public IP</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.server_basePath}}`}</code> - Default base path</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.server_appPath}}`}</code> - Base path + site name</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.server_availablePort}}`}</code> - First available port</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.server_availablePorts}}`}</code> - CSV of available ports</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.server_usedPorts}}`}</code> - CSV of used ports</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded text-blue-500">{`{{universal.server_reservedPort}}`}</code> - Port reserved for this execution (if any)</li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.site_id}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.site_name}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{universal.account_id}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded text-red-500">{`{{universal.account_githubToken}}`}</code></li>
                    </ul>
                </AlertDescription>
            </Alert>
            </TabsContent>
            
            <TabsContent value="pre-processor" className="pt-6 space-y-4">
              <h3 className="text-xl font-semibold font-headline">JavaScript Pre-Processor</h3>
              <p>
                The `javascript.preProcessor` block runs on our application server *before* the bash script is sent to your server. It's a powerful way to prepare data.
              </p>
              <p>Two objects are available in its scope: `params` (user input) and `universal` (built-in variables).</p>
              <h4 className="font-semibold pt-2">Use Case 1: Modifying Parameters</h4>
              <p>You can return an object from the script. Its properties will be merged with the user's parameters, overriding any existing keys.</p>
              <CodeBlock>
{`<javascript.preProcessor>
  // User enters 'My App' for a 'appName' parameter.
  const appSlug = params.appName.toLowerCase().replace(/\\s+/g, '-');
  
  // This makes {{appSlug}} available in the bash script.
  return { appSlug: appSlug };
</javascript.preProcessor>

<server.ubuntuBashProcessor>
  mkdir -p /var/www/{{appSlug}}
</server.ubuntuBashProcessor>`}
              </CodeBlock>
              <h4 className="font-semibold pt-2">Use Case 2: Dynamic Command Generation</h4>
              <p>If you return a string from the pre-processor, it will completely replace the `server.ubuntuBashProcessor` block for that execution.</p>
              <CodeBlock>
{`<javascript.preProcessor>
  if (params.install_type === 'full') {
    return 'sudo apt-get install -y nginx nodejs npm';
  }
  return 'sudo apt-get install -y nginx';
</javascript.preProcessor>

<server.ubuntuBashProcessor>
  # This content will be ignored if the pre-processor returns a string.
</server.ubuntuBashProcessor>`}
              </CodeBlock>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
