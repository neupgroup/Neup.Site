'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog';
import { Button } from '#/components/ui/buttons';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Plus } from 'lucide-react';

interface AddDomainDialogProps {
    onAdd: (domain: string) => void;
}

export function AddDomainDialog({ onAdd }: AddDomainDialogProps) {
    const [open, setOpen] = useState(false);
    const [domain, setDomain] = useState('');
    const [error, setError] = useState('');

    const handleAdd = () => {
        if (!domain.trim()) {
            setError('Domain is required');
            return;
        }

        const pattern = /^[a-zA-Z0-9.-]+(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        if (!pattern.test(domain)) {
            setError('Invalid domain or path format');
            return;
        }

        onAdd(domain);
        setDomain('');
        setError('');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="tertiary">
                    <Plus className="mr-2" /> Add Domain
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Domain</DialogTitle>
                    <DialogDescription>
                        Enter the domain name you want to connect to your site.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="domain">Domain Name</Label>
                        <Input
                            id="domain"
                            placeholder="e.g., yourdomain.com"
                            value={domain}
                            onChange={(e) => {
                                setDomain(e.target.value);
                                setError('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAdd();
                                }
                            }}
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="button" onClick={handleAdd}>
                        Add Domain
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
