import type { CanvasElementData } from "@/lib/schemas";

export const headerTemplate: CanvasElementData = {
  id: "header-section",
  type: "section",
  properties: {
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
      properties: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      },
      children: [
        {
          id: "logo-image",
          type: "image",
          properties: {
            src: "https://picsum.photos/seed/logo/40/40",
            alt: "Logo",
            width: "40px",
            height: "40px",
            borderRadius: "9999px",
          },
        },
        {
          id: "logo-text",
          type: "heading",
          properties: {
            text: "MyApp",
            level: 3,
            fontSize: "1.5rem",
            fontWeight: "bold",
          },
        },
      ],
    },
    {
      id: "nav-menu",
      type: "div",
      properties: {
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
      },
      children: [
        {
          id: "nav-link-1",
          type: "text",
          properties: {
            text: '<a href="#" style="color: hsl(var(--foreground)); text-decoration: none;">Home</a>',
          },
        },
        {
          id: "nav-link-2",
          type: "text",
          properties: {
            text: '<a href="#" style="color: hsl(var(--foreground)); text-decoration: none;">About</a>',
          },
        },
        {
          id: "nav-link-3",
          type: "text",
          properties: {
            text: '<a href="#" style="color: hsl(var(--foreground)); text-decoration: none;">Pricing</a>',
          },
        },
      ],
    },
    {
      id: "cta-button",
      type: "button",
      properties: {
        text: "Get Started",
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
