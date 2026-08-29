
'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Button } from '#/components/ui/buttons';
import { Label } from '#/components/ui/label';
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group';
import { ArrowLeft, Send } from 'lucide-react';
import { Input } from '#/components/ui/input';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function JobPostingOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [postingOption, setPostingOption] = useState('company');
  usePageTitle('Posting Options');
  
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="mb-4">
        <Button variant="tertiary" asChild>
          <Link href={`/manage/hiring/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Posting
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Posting Options</CardTitle>
          <CardDescription>Choose where and how to post this job.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={postingOption} onValueChange={setPostingOption} className="space-y-4">
            <Label htmlFor="neup-jobs" className="block cursor-pointer">
              <Card className="has-[:checked]:border-primary">
                <CardHeader className="flex flex-row items-center gap-4">
                   <RadioGroupItem value="neup" id="neup-jobs" />
                  <div>
                    <h3 className="font-semibold">Post on Neup.Jobs</h3>
                    <p className="text-sm text-muted-foreground">NRs. 20 per day. Reach a wide audience.</p>
                  </div>
                </CardHeader>
              </Card>
            </Label>

            <Label htmlFor="company-website" className="block cursor-pointer">
              <Card className="has-[:checked]:border-primary">
                 <CardHeader className="flex flex-row items-center gap-4">
                  <RadioGroupItem value="company" id="company-website" />
                  <div>
                    <h3 className="font-semibold">Company Website Only</h3>
                    <p className="text-sm text-muted-foreground">Free. Post only on your public career page.</p>
                  </div>
                </CardHeader>
              </Card>
            </Label>
            
            <Label htmlFor="urgent-hire" className="block cursor-pointer">
                <Card className="has-[:checked]:border-primary">
                    <CardHeader className="flex flex-row items-start gap-4">
                         <RadioGroupItem value="urgent" id="urgent-hire" />
                        <div className="flex-1">
                            <h3 className="font-semibold">Hire Urgently</h3>
                            <p className="text-sm text-muted-foreground">Promote your job posting for faster hiring.</p>
                        </div>
                    </CardHeader>
                    {postingOption === 'urgent' && (
                        <CardContent className="space-y-4 pl-12">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="budget">Budget (NRs.)</Label>
                                    <Input id="budget" type="number" placeholder="e.g., 5000" />
                                </div>
                                <div>
                                    <Label htmlFor="timeframe">Timeframe (days)</Label>
                                    <Input id="timeframe" type="number" placeholder="e.g., 14" />
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </Label>
          </RadioGroup>
        </CardContent>
        <CardFooter>
            <Button>
                <Send className="mr-2 h-4 w-4" />
                Confirm Posting
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
