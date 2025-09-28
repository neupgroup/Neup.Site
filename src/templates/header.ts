import type { CanvasElementData } from "@/lib/schemas";

export const headerTemplate: CanvasElementData = {
  id: "header-section",
  type: "section",
  properties: {
    'spacing.padding': "1rem 2rem",
    'layout.display': "flex",
    'layout.alignItems': "center",
    'layout.justifyContent': "space-between",
    'borders.borderBottom': "1px solid hsl(var(--border))",
    'background.backgroundColor': "hsl(var(--background))",
  },
  children: [
    {
      id: "logo-container",
      type: "div",
      properties: {
        'layout.display': "flex",
        'layout.alignItems': "center",
        'layout.gap': "0.5rem",
      },
      children: [
        {
          id: "logo-image",
          type: "image",
          properties: {
            'image.src': "https://picsum.photos/seed/logo/40/40",
            'image.alt': "Logo",
            'layout.width': "40px",
            'layout.height': "40px",
            'borders.borderRadius': "9999px",
          },
        },
        {
          id: "logo-text",
          type: "heading",
          properties: {
            'content.text': "MyApp",
            'heading.level': 3,
            'typography.fontSize': "1.5rem",
            'typography.fontWeight': "bold",
          },
        },
      ],
    },
    {
      id: "nav-menu",
      type: "div",
      properties: {
        'layout.display': "flex",
        'layout.gap': "1.5rem",
        'layout.alignItems': "center",
      },
      children: [
        {
          id: "nav-link-1",
          type: "link",
          properties: {
            'content.text': "Home",
            'link.href': "#",
            'typography.color': "hsl(var(--foreground))",
            'typography.textDecoration': "none",
          },
        },
        {
          id: "nav-link-2",
          type: "link",
          properties: {
            'content.text': "About",
            'link.href': "#",
            'typography.color': "hsl(var(--foreground))",
            'typography.textDecoration': "none",
          },
        },
        {
          id: "nav-link-3",
          type: "link",
          properties: {
            'content.text': "Pricing",
            'link.href': "#",
            'typography.color': "hsl(var(--foreground))",
            'typography.textDecoration': "none",
          },
        },
      ],
    },
    {
      id: "cta-button",
      type: "button",
      properties: {
        'content.text': "Get Started",
        'layout.display': "inline-block",
        'spacing.padding': "0.5rem 1rem",
        'typography.fontSize': "1rem",
        'typography.color': "hsl(var(--primary-foreground))",
        'background.backgroundColor': "hsl(var(--primary))",
        'typography.textAlign': "center",
        'borders.borderRadius': "var(--radius)",
        'borders.border': "none",
        'attributes.cursor': "pointer",
      },
    },
  ],
};
