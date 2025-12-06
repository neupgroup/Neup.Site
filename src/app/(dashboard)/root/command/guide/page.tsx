
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code, ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto mt-2 mb-4">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

export default function CommandsGuidePage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <Button asChild variant="ghost" className="pl-0">
        <Link href="/root/command">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Commands
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-left">
            <Code className="h-6 w-6" />
            Server Command Guide
          </CardTitle>
          <CardDescription className="text-left">
            Learn how to create powerful and reusable command templates for your servers.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 text-left">
          {/* ---------------- COMMAND STRUCTURE ---------------- */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Command Structure</h2>
            <p>
              Commands are composed of two main parts wrapped in an XML-like structure. This allows
              both pre-processing logic and the final bash script to be defined in one place.
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
              Placeholders like <code>{'{{name}}'}</code> are automatically detected and will create
              input fields on the command execution form.
            </p>
          </section>
          
           {/* ---------------- JAVASCRIPT PRE-PROCESSOR ---------------- */}
          <section>
            <h2 className="text-xl font-semibold mb-2">JavaScript Pre-Processor</h2>
            <p>
              The <code>{'<javascript.preProcessor>'}</code> block runs on our application server{' '}
              <em>before</em> the bash script is sent to your server. It’s a powerful way to prepare
              data dynamically.
            </p>
            <p>
              You can access any user-defined or universal parameter directly using the same{' '}
              <code>{'{{variableName}}'}</code> syntax as the bash script. These values are injected as
              JavaScript literals before execution.
            </p>

            <h3 className="font-semibold pt-4 pb-1">Use Case 1: Modifying Parameters</h3>
            <p>
              You can return an object from the script. Its properties will be merged with the user’s
              parameters, overriding any existing keys. This makes them available to the bash script.
            </p>
            <CodeBlock>
{`<javascript.preProcessor>
  // User enters 'My App' for an 'appName' parameter.
  const appSlug = {{appName}}.toLowerCase().replace(/\\s+/g, '-');
  
  // This makes {{appSlug}} available in the bash script.
  return { appSlug: appSlug };
</javascript.preProcessor>

<server.ubuntuBashProcessor>
  mkdir -p /var/www/{{appSlug}}
</server.ubuntuBashProcessor>`}
            </CodeBlock>

            <h3 className="font-semibold pt-4 pb-1">Use Case 2: Dynamic Command Generation</h3>
            <p>
              If you return a string from the pre-processor, it will completely replace the{' '}
              <code>{'<server.ubuntuBashProcessor>'}</code> block for that execution.
            </p>
            <CodeBlock>
{`<javascript.preProcessor>
  if ({{install_type}} === 'full') {
    return 'sudo apt-get install -y nginx nodejs npm';
  }
  return 'sudo apt-get install -y nginx';
</javascript.preProcessor>

<server.ubuntuBashProcessor>
  # This content will be ignored if the pre-processor returns a string.
</server.ubuntuBashProcessor>`}
            </CodeBlock>
          </section>


          {/* ---------------- UNIVERSAL VARIABLES ---------------- */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Universal Variables</h2>
            <p>
              You can use a set of built-in “universal” variables in both the pre-processor and the bash script using{' '}
              <code>{'{{variableName}}'}</code> syntax.
            </p>

            <Alert className="mt-4">
              <Globe className="h-4 w-4" />
              <AlertTitle>Available Universal Variables</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.server_name}}'}
                    </code>
                  </li>
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.server_publicIp}}'}
                    </code>
                  </li>
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.server_basePath}}'}
                    </code>
                  </li>
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.server_appPath}}'}
                    </code>
                  </li>
                   <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded text-blue-500">
                      {'{{universal.app_port}}'}
                    </code>
                  </li>
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.site_id}}'}
                    </code>
                  </li>
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.site_name}}'}
                    </code>
                  </li>
                   <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.site_domain}}'}
                    </code>
                  </li>
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded">
                      {'{{universal.account_id}}'}
                    </code>
                  </li>
                  <li>
                    <code className="font-mono bg-muted px-1 py-0.5 rounded text-red-500">
                      {'{{universal.account_githubToken}}'}
                    </code>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
