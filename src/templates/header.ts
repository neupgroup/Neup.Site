
import type { CanvasElementData } from "@/lib/schemas";

export const headerTemplate: CanvasElementData = {
  id: "header-section",
  type: "section",
  styles: {
    padding: "1rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid hsl(var(--border))",
    backgroundColor: "hsl(var(--background))",
  },
  children: [
    {
      id: "logo-container",
      type: "div",
      styles: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      },
      children: [
        {
          id: "logo-image",
          type: "image",
          props: {
            src: "https://picsum.photos/seed/logo/40/40",
            alt: "Logo",
          },
          styles: {
            width: "40px",
            height: "40px",
            borderRadius: "9999px",
          },
        },
        {
          id: "logo-text",
          type: "heading",
          content: "MyApp",
          props: {
            level: 3,
          },
          styles: {
            fontSize: "1.5rem",
            fontWeight: "bold",
          },
        },
      ],
    },
    {
      id: "nav-menu",
      type: "div",
      styles: {
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
      },
      children: [
        {
          id: "nav-link-1",
          type: "link",
          content: "Home",
          props: { href: "#" },
          styles: {
            color: "hsl(var(--foreground))",
            textDecoration: "none",
          },
        },
        {
          id: "nav-link-2",
          type: "link",
          content: "About",
          props: { href: "#" },
          styles: {
            color: "hsl(var(--foreground))",
            textDecoration: "none",
          },
        },
        {
          id: "nav-link-3",
          type: "link",
          content: "Pricing",
          props: { href: "#" },
          styles: {
            color: "hsl(var(--foreground))",
            textDecoration: "none",
          },
        },
      ],
    },
    {
      id: "cta-button",
      type: "button",
      content: "Get Started",
      styles: {
        display: "inline-block",
        padding: "0.5rem 1rem",
        fontSize: "1rem",
        color: "hsl(var(--primary-foreground))",
        backgroundColor: "hsl(var(--primary))",
        textAlign: "center",
        borderRadius: "var(--radius)",
        border: "none",
        cursor: "pointer",
      },
    },
  ],
};
