import type { CanvasElementData } from "@/lib/schemas";

export const footerTemplate: CanvasElementData = {
  id: "footer-section",
  type: "section",
  properties: {
    'spacing.padding': "4rem 2rem 2rem 2rem",
    'background.backgroundColor': "hsl(var(--card))",
    'borders.borderTop': "1px solid hsl(var(--border))",
    'layout.display': "block",
  },
  children: [
    {
      id: "footer-content",
      type: "div",
      properties: {
        'layout.display': "grid",
        'layout.gridTemplateColumns': "repeat(auto-fit, minmax(200px, 1fr))",
        'layout.gap': "2rem",
        'spacing.marginBottom': "3rem",
        'layout.maxWidth': "1200px",
        'spacing.marginLeft': "auto",
        'spacing.marginRight': "auto",
      },
      children: [
        {
          id: "footer-branding",
          type: "div",
          properties: {},
          children: [
            {
              id: "footer-logo-text",
              type: "heading",
              properties: {
                'content.text': "MyApp",
                'heading.level': 3,
                'typography.fontSize': "1.5rem",
                'typography.fontWeight': "bold",
                'spacing.marginBottom': "0.5rem",
              },
            },
            {
              id: "footer-tagline",
              type: "text",
              properties: {
                'content.text': "Build better, faster.",
                'typography.color': "hsl(var(--muted-foreground))",
              },
            },
          ],
        },
        {
          id: "footer-links-product",
          type: "div",
          properties: {},
          children: [
            {
              id: "product-heading",
              type: "heading",
              properties: {
                'content.text': "Product",
                'heading.level': 4,
                'typography.fontWeight': "bold",
                'spacing.marginBottom': "1rem",
              },
            },
            {
              id: "product-links-list",
              type: "div",
              properties: { 'layout.display': "flex", 'layout.flexDirection': "column", 'layout.gap': "0.5rem" },
              children: [
                { id: "link-features", type: "link", properties: { 'content.text': "Features", 'link.href': "#", 'typography.textDecoration': "none", 'typography.color': "hsl(var(--muted-foreground))" } },
                { id: "link-pricing", type: "link", properties: { 'content.text': "Pricing", 'link.href': "#", 'typography.textDecoration': "none", 'typography.color': "hsl(var(--muted-foreground))" } },
                { id: "link-docs", type: "link", properties: { 'content.text': "Documentation", 'link.href': "#", 'typography.textDecoration': "none", 'typography.color': "hsl(var(--muted-foreground))" } },
              ]
            }
          ],
        },
        {
            id: "footer-links-company",
            type: "div",
            properties: {},
            children: [
              {
                id: "company-heading",
                type: "heading",
                properties: {
                  'content.text': "Company",
                  'heading.level': 4,
                  'typography.fontWeight': "bold",
                  'spacing.marginBottom': "1rem",
                },
              },
              {
                id: "company-links-list",
                type: "div",
                properties: { 'layout.display': "flex", 'layout.flexDirection': "column", 'layout.gap': "0.5rem" },
                children: [
                  { id: "link-about", type: "link", properties: { 'content.text': "About Us", 'link.href': "#", 'typography.textDecoration': "none", 'typography.color': "hsl(var(--muted-foreground))" } },
                  { id: "link-careers", type: "link", properties: { 'content.text': "Careers", 'link.href': "#", 'typography.textDecoration': "none", 'typography.color': "hsl(var(--muted-foreground))" } },
                  { id: "link-contact", type: "link", properties: { 'content.text': "Contact", 'link.href': "#", 'typography.textDecoration': "none", 'typography.color': "hsl(var(--muted-foreground))" } },
                ]
              }
            ],
          },
      ],
    },
    {
      id: "footer-bottom",
      type: "div",
      properties: {
        'borders.borderTop': "1px solid hsl(var(--border))",
        'spacing.paddingTop': "2rem",
        'layout.display': "flex",
        'layout.justifyContent': "space-between",
        'layout.alignItems': "center",
        'layout.maxWidth': "1200px",
        'spacing.marginLeft': "auto",
        'spacing.marginRight': "auto",
        'layout.flexWrap': 'wrap',
        'layout.gap': '1rem',
      },
      children: [
        {
          id: "copyright-text",
          type: "text",
          properties: {
            'content.text': "© 2024 MyApp. All rights reserved.",
            'typography.fontSize': "0.875rem",
            'typography.color': "hsl(var(--muted-foreground))",
          },
        },
      ],
    },
  ],
};
