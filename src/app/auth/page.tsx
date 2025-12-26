
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setSiteIdCookie } from '@/actions/auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { KeyRound, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AuthPage() {
  const [siteId, setSiteId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    document.title = 'Sign In, NeupSites';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteId) {
        toast({
            variant: 'destructive',
            title: 'Site ID is required',
        })
        return
    }
    setLoading(true)
    const result = await setSiteIdCookie(siteId)

    if (result.success) {
        toast({
            title: 'Authentication Success',
            description: `You are now working on site: ${siteId}`,
        })
        router.push('/')
        router.refresh()
    } else {
        toast({
            variant: 'destructive',
            title: 'Authentication Failed',
            description: result.error,
        })
        setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                    <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Enter Site ID</CardTitle>
                <CardDescription>Enter the Site ID you want to work on. A new site will be created if it doesn't exist.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="siteId">Site ID</Label>
                    <Input
                    id="siteId"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    placeholder="e.g., my-awesome-site"
                    required
                    autoComplete="off"
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</> : 'Enter'}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  )
}
