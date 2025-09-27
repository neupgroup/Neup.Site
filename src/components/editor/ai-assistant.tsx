'use client';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAiDesignSuggestionsAction } from '@/app/actions/ai/design';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Palette, Type, Layout, FileText } from 'lucide-react';
import { type AiDesignSuggestionsOutput } from '@/ai/flows/ai-design-suggestions';

const suggestionSchema = z.object({
  designDescription: z.string().min(10, 'Please provide a more detailed description.'),
  desiredAesthetic: z.string().min(3, 'Please describe the desired aesthetic.'),
});

type SuggestionFormValues = z.infer<typeof suggestionSchema>;

const AiAssistant = () => {
  const [suggestions, setSuggestions] = useState<AiDesignSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      designDescription: 'A simple landing page with a hero section, a single image, and a call to action button. The color scheme is light with blue accents.',
      desiredAesthetic: 'Minimalist and modern.',
    },
  });

  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await getAiDesignSuggestionsAction(data);
      setSuggestions(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI suggestions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Design Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="designDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Design</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your current design..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="desiredAesthetic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Aesthetic</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., minimalist, corporate, playful" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Get Suggestions'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="space-y-4 animate-pulse">
            <div className="h-24 w-full rounded-lg bg-muted"></div>
            <div className="h-24 w-full rounded-lg bg-muted"></div>
         </div>
      )}

      {suggestions && (
        <div className="space-y-4">
          <h3 className="font-headline text-lg font-semibold">Suggestions</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-primary"/> Color Combinations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{suggestions.colorSuggestions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4 text-primary"/> Font Pairings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{suggestions.fontPairingSuggestions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Layout className="h-4 w-4 text-primary"/> Layout Improvements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{suggestions.layoutSuggestions}</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary"/> Content Improvements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{suggestions.contentSuggestions}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
