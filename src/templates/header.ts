import type { CanvasElementData } from "@/schemas/canvas";

export const headerTemplate: CanvasElementData = {
  id: "header-section",
  type: "section",
  properties: {
    padding: "1rem 2rem",
    backgroundColor: "hsl(var(--background))",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid hsl(var(--border))",
    justifyContent: "space-between",
  },
  children: [
    {
      id: "logo-container",
      type: "div",
      properties: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
      },
      children: [
        {
          id: "logo-image",
          type: "image",
          properties: {
            borderRadius: "9999px",
            width: "40px",
            height: "40px",
            src: "https://picsum.photos/seed/logo/40/40",
            alt: "Logo",
          },
        },
        {
          id: "logo-text",
          type: "heading",
          properties: {
            fontWeight: "bold",
            fontSize: "1.5rem",
            text: "MyApp",
            level: 3,
          },
        },
      ],
    },
    {
      id: "nav-menu",
      type: "div",
      properties: {
        alignItems: "center",
        gap: "1.5rem",
        display: "flex",
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
        fontSize: "1rem",
        border: "none",
        color: "hsl(var(--primary-foreground))",
        textAlign: "center",
        borderRadius: "var(--radius)",
        cursor: "pointer",
        padding: "0.5rem 1rem",
        backgroundColor: "hsl(var(--primary))",
      },
    },
  ],
};