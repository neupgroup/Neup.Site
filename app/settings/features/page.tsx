'use client';

import { useEffect, useState } from 'react';
import { Button } from '#/components/ui/button';
import { useProfile } from '@/inapp/context/ProfileContext';
import { saveAsset } from '@/services/editor/asset';
import type { AssetFeatures } from '@/services/asset/type';

const databaseOptions = [
  { value: 'postgresql', label: 'Postgre SQL', description: 'Slow, concurrent' },
  { value: 'sqlite', label: 'SQLite', description: 'Extremely fast, remote interactions' },
  { value: 'mysql', label: 'MySQL', description: 'Not preferred' },
];

export default function FeaturesSettingsPage() {
  const { asset, setAsset, loading } = useProfile();
  const [needsDatabase, setNeedsDatabase] = useState<string>('');
  const [database, setDatabase] = useState<string>('');
  const [needsAccount, setNeedsAccount] = useState<string>('');
  const [interactsLocally, setInteractsLocally] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    const features = asset?.features;
    setNeedsDatabase(features?.database?.isRequired ? 'yes' : 'no');
    setDatabase(features?.database?.requiredType || '');
    setNeedsAccount(features?.accountSupport?.isRequired ? 'yes' : 'no');
    setInteractsLocally(features?.accountSupport?.interactionType || '');
  }, [asset, loading]);

  const handleSave = async () => {
    setIsSaving(true);
    const features: AssetFeatures = {
      database: { isRequired: needsDatabase === 'yes', requiredType: needsDatabase === 'yes' ? database : undefined },
      accountSupport: {
        isRequired: needsAccount === 'yes',
        interactionType: needsAccount === 'yes' ? (interactsLocally === 'yes' ? 'local' : 'remote') : undefined,
      },
    };
    const result = await saveAsset({ features });
    if (result.success && asset) setAsset({ ...asset, features });
    setIsSaving(false);
  };

  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Features</h1>
        <p className="text-muted-foreground">Configure the features available on your site.</p>
      </header>
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Database</h2>
          <p className="text-sm text-muted-foreground">Configure database support for your site.</p>
        </div>

        <div className="space-y-5">
          <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Need database support?</legend>
                <div className="flex gap-6">
                  {['yes', 'no'].map((option) => (
                    <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="needs-database"
                        value={option}
                        checked={needsDatabase === option}
                        onChange={(event) => {
                          setNeedsDatabase(event.target.value);
                          if (event.target.value === 'no') setDatabase('');
                        }}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

          {needsDatabase === 'yes' && (
            <fieldset className="space-y-2 border-t pt-4">
                  <legend className="text-sm font-medium">Choose a database</legend>
                  <div className="space-y-2">
                    {databaseOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-start gap-3 rounded-md border p-2 transition-colors hover:bg-muted/50"
                      >
                        <input
                          type="radio"
                          name="database"
                          value={option.value}
                          checked={database === option.value}
                          onChange={(event) => setDatabase(event.target.value)}
                          className="mt-1 h-4 w-4 accent-primary"
                        />
                        <span>
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="block text-sm text-muted-foreground">{option.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
            </fieldset>
          )}

        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">Configure account support for your site.</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Need account support?</legend>
          <div className="flex gap-6">
            {['yes', 'no'].map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="needs-account"
                  value={option}
                  checked={needsAccount === option}
                  onChange={(event) => {
                    setNeedsAccount(event.target.value);
                    if (event.target.value === 'no') setInteractsLocally('');
                  }}
                  className="h-4 w-4 accent-primary"
                />
                <span className="capitalize">{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {needsAccount === 'yes' && (
          <fieldset className="space-y-3 border-t pt-4">
            <legend className="text-sm font-medium">Interact with account locally?</legend>
            <div className="flex gap-6">
              {['yes', 'no'].map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="interacts-locally"
                    value={option}
                    checked={interactsLocally === option}
                    onChange={(event) => setInteractsLocally(event.target.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </section>

      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !needsDatabase || (needsDatabase === 'yes' && !database) || !needsAccount || (needsAccount === 'yes' && !interactsLocally)}
      >
        {isSaving ? 'Saving...' : 'Done'}
      </Button>
    </div>
  );
}
