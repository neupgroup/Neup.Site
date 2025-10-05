
import { Rocket, BarChart, Brush, Server, ChevronRight } from 'lucide-react';
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
      <header className="py-4 px-6 md:px-10 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight">Neup.Sites</h1>
        </div>
        <Button asChild>
            <Link href="/">Get Started</Link>
        </Button>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="text-center py-20 px-4">
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">Build Your Business, Not Just a Website.</h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
            Your creative pursuit deserves more than a template. Launch your e-commerce store, news portal, real estate platform, or your next big idea with a platform designed for growth and limitless customization.
          </p>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/">Start Building for Free</Link>
          </Button>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-card border-y">
            <div className="container mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-4">Why Neup.Sites?</h2>
                <p className="text-center text-muted-foreground mb-12">Built for developers, designers, and entrepreneurs who demand more.</p>
                <div className="grid md:grid-cols-3 gap-10">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <BarChart className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold font-headline mb-2">Engineered for Scale</h3>
                        <p className="text-muted-foreground">With our custom scaling software and high-availability architecture, your site is prepared for traffic spikes and business growth from day one.</p>
                    </div>
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Brush className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold font-headline mb-2">Unhinged Creative Freedom</h3>
                        <p className="text-muted-foreground">Escape the rigid constraints of templates. If you can envision it, you can build it, with full access to modify and extend any part of your site.</p>
                    </div>
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Server className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold font-headline mb-2">Powerful Deployment Engine</h3>
                        <p className="text-muted-foreground">Go from concept to live production on your own server with a seamless and powerful deployment workflow built for professionals.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Engine Section */}
        <section className="py-20 px-4">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div>
                     <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">The Neup.Sites Engine</h2>
                     <p className="text-lg text-muted-foreground">Our intelligent engine accelerates your workflow, it doesn't replace your creativity. Describe the components and data structures you need, and let it generate the boilerplate code, freeing you to focus on the unique, high-value parts of your project.</p>
                </div>
                <div className="flex items-center justify-center">
                    <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                         <Rocket className="h-32 w-32 text-primary opacity-80" />
                    </div>
                </div>
            </div>
        </section>


        {/* Workflow Section */}
        <section className="py-20 px-4 bg-card border-y">
            <div className="container mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-12">A Radically Simple Workflow</h2>
                <div className="relative">
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2"></div>
                    <div className="grid md:grid-cols-3 gap-10 relative">
                        <div className="text-center p-6 rounded-lg">
                            <div className="mb-4 text-4xl font-bold text-primary">1</div>
                            <h3 className="text-xl font-bold font-headline mb-2">Define Structure</h3>
                            <p className="text-muted-foreground">Create pages, define data sources, and use our Creative Engine to generate section components and their data schemas.</p>
                        </div>
                        <div className="text-center p-6 rounded-lg">
                            <div className="mb-4 text-4xl font-bold text-primary">2</div>
                            <h3 className="text-xl font-bold font-headline mb-2">Build & Customize</h3>
                            <p className="text-muted-foreground">Assemble pages by arranging sections. Dive into the code at any time to make custom changes and add unique logic.</p>
                        </div>
                        <div className="text-center p-6 rounded-lg">
                            <div className="mb-4 text-4xl font-bold text-primary">3</div>
                            <h3 className="text-xl font-bold font-headline mb-2">Deploy to a Server</h3>
                            <p className="text-muted-foreground">Connect to your own server, build the final site structure, and deploy your production-ready application.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-20 px-4">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">Ready to build without limits?</h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            Start leveraging the power of Neup.Sites today and transform how you build scalable, custom web applications.
          </p>
          <Button size="lg" asChild>
            <Link href="/">Start Your Project Now</Link>
          </Button>
        </section>
      </main>

      <footer className="py-6 px-4 md:px-10 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Neup.Sites. All rights reserved.</p>
      </footer>
    </div>
  );
}
