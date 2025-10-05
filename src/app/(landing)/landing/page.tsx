import { Rocket, BarChart, Brush, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSite } from '@/actions/editor/site';
import { cn } from '@/lib/utils';

export default async function LandingPage() {
  const { site } = await getSite();
  const radius = site?.theme?.radius;
  const radiusClass = radius ? `radius-${radius}` : 'radius-medium';
  const themeMode = site?.theme?.mode || 'light';

  return (
    <div className={cn("bg-background text-foreground", themeMode, radiusClass)}>
      
      <main>

        {/* HERO SECTION */}
        <section className="w-full py-24">
          <div className="mx-auto w-full max-w-screen-xl px-6 md:px-10">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-6 max-w-4xl leading-tight">
              Build Your Business, <br /> Not Just a Website.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
              Launch your store, news portal, real estate platform, or your next big idea on a platform built for serious growth and limitless customization.
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/">Start Building for Free</Link>
            </Button>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="w-full bg-card border-y py-20">
          <div className="mx-auto w-full max-w-screen-xl px-6 md:px-10">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">Why Neup.Sites?</h2>
            <p className="text-muted-foreground mb-12 max-w-2xl">
              Built for developers, designers, and entrepreneurs who demand more.
            </p>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  icon: BarChart,
                  title: 'Engineered for Scale',
                  desc: 'Custom scaling software and high-availability architecture keep your business ready for traffic spikes and growth from day one.',
                },
                {
                  icon: Brush,
                  title: 'Unhinged Creative Freedom',
                  desc: 'Break free from template constraints. If you can imagine it, you can build it — full code access included.',
                },
                {
                  icon: Server,
                  title: 'Powerful Deployment Engine',
                  desc: 'Deploy to your own server with a seamless, professional-grade workflow built for real projects.',
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="text-left">
                  <div className="p-4 bg-primary/10 rounded-lg w-fit mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-2">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ENGINE SECTION */}
        <section className="w-full py-20">
          <div className="mx-auto w-full max-w-screen-xl px-6 md:px-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">The Neup.Sites Engine</h2>
              <p className="text-lg text-muted-foreground max-w-lg">
                Our intelligent engine accelerates your workflow — it doesn’t replace your creativity. Describe your structure, generate boilerplate, and focus on what makes your project unique.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <Rocket className="h-32 w-32 text-primary opacity-80" />
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section className="w-full bg-card border-y py-20">
          <div className="mx-auto w-full max-w-screen-xl px-6 md:px-10">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-12">A Radically Simple Workflow</h2>
            <div className="grid md:grid-cols-3 gap-10 relative">
              {[ 
                {
                  step: 1,
                  title: 'Define Structure',
                  desc: 'Create pages, define data sources, and generate sections with our Creative Engine.'
                },
                {
                  step: 2,
                  title: 'Build & Customize',
                  desc: 'Assemble pages, dive into the code, and craft unique experiences.'
                },
                {
                  step: 3,
                  title: 'Deploy to a Server',
                  desc: 'Push to your own server and go live with production-grade deployments.'
                }
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-left p-6 rounded-lg">
                  <div className="mb-4 text-4xl font-bold text-primary">{step}</div>
                  <h3 className="text-xl font-bold font-headline mb-2">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-24">
          <div className="mx-auto w-full max-w-screen-xl px-6 md:px-10">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4 max-w-2xl">
              Ready to build without limits?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mb-10">
              Start leveraging the power of Neup.Sites today and transform how you build scalable, custom web applications.
            </p>
            <Button size="lg" asChild>
              <Link href="/">Start Your Project Now</Link>
            </Button>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border py-6">
        <div className="mx-auto w-full max-w-screen-xl px-6 md:px-10">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Neup.Sites. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
