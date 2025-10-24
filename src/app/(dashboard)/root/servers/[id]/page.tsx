"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Play,
  Loader2,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { getServerCommands, type ServerCommand } from "@/actions/commands";
import { runCommand } from "@/actions/runner";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function ServerManagement({ serverId }: { serverId: string }) {
  const [commands, setCommands] = useState<ServerCommand[]>([]);
  const [selectedCommandId, setSelectedCommandId] = useState<string>("");
  const [params, setParams] = useState<Record<string, any>>({});
  const [loadingCommands, setLoadingCommands] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCommands = async () => {
      setLoadingCommands(true);
      const result = await getServerCommands({});
      if (result.success && result.commands) {
        setCommands(result.commands);
      } else {
        setError(result.error || "Failed to load commands.");
      }
      setLoadingCommands(false);
    };
    fetchCommands();
  }, []);

  const handleCommandChange = (commandId: string) => {
    setSelectedCommandId(commandId);
    setParams({}); // Reset params when command changes
    setOpen(false);
  };

  const handleParamChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleRunCommand = async () => {
    setIsRunning(true);
    try {
      await runCommand(serverId, selectedCommandId, params);
      toast({
        title: "Command Sent",
        description:
          "The command has been sent to the server. Check the logs for output.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error Running Command",
        description: e.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const selectedCommand = commands.find((c) => c.id === selectedCommandId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Management</CardTitle>
        <CardDescription>
          Run pre-defined commands on this server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="run-saved-command" className="border-0">
            <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
              <div>
                <h4 className="font-medium text-left">Run Saved Command</h4>
                <p className="text-sm text-muted-foreground text-left">
                  Execute a pre-defined command template on this server.
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border rounded-b-lg p-4 space-y-4 overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              {loadingCommands ? (
                <Skeleton className="h-10 w-full" />
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Command</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {selectedCommandId
                            ? commands.find(
                                (cmd) => cmd.id === selectedCommandId
                              )?.name
                            : "Select a command to run..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search commands..." />
                          <CommandList>
                            <CommandEmpty>No command found.</CommandEmpty>
                            <CommandGroup>
                              {commands.map((cmd) => (
                                <CommandItem
                                  key={cmd.id}
                                  value={cmd.id}
                                  onSelect={(currentValue) => {
                                    handleCommandChange(
                                      currentValue === selectedCommandId
                                        ? ""
                                        : currentValue
                                    );
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCommandId === cmd.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {cmd.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedCommand &&
                    selectedCommand.parameters &&
                    selectedCommand.parameters.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                        {selectedCommand.parameters.map((param) => (
                          <div key={param.key} className="space-y-1.5">
                            <Label htmlFor={`param-${param.key}`}>
                              {param.label}
                            </Label>
                            <Input
                              id={`param-${param.key}`}
                              type={param.type === "number" ? "number" : "text"}
                              value={params[param.key] || ""}
                              onChange={(e) =>
                                handleParamChange(param.key, e.target.value)
                              }
                              placeholder={param.defaultValue}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                  <Button
                    onClick={handleRunCommand}
                    disabled={!selectedCommandId || isRunning}
                  >
                    {isRunning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {isRunning ? "Running..." : "Run Command"}
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
