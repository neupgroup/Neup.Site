import type { CanvasElementData } from "@/services/canvas/type";

export const footerTemplate: CanvasElementData = {
  id: "footer-section",
  type: "section",
  properties: {
    padding: "4rem 2rem 2rem 2rem",
    backgroundColor: "hsl(var(--card))",
    borderTop: "1px solid hsl(var(--border))",
    display: "block",
  },
  children: [
    {
      id: "footer-content",
      type: "div",
      properties: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "2rem",
        marginBottom: "3rem",
        maxWidth: "1200px",
        marginLeft: "auto",
        marginRight: "auto",
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
                text: "MyApp",
                level: 3,
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
              },
            },
            {
              id: "footer-tagline",
              type: "text",
              properties: {
                text: "Build better, faster.",
                color: "hsl(var(--muted-foreground))",
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
                text: "Product",
                level: 4,
                fontWeight: "bold",
                marginBottom: "1rem",
              },
            },
            {
              id: "product-links-list",
              type: "div",
              properties: { display: "flex", flexDirection: "column", gap: "0.5rem" },
              children: [
                { id: "link-features", type: "text", properties: { text: '<a href="#" style="text-decoration: none; color: hsl(var(--muted-foreground));">Features</a>' } },
                { id: "link-pricing", type: "text", properties: { text: '<a href="#" style="text-decoration: none; color: hsl(var(--muted-foreground));">Pricing</a>' } },
                { id: "link-docs", type: "text", properties: { text: '<a href="#" style="text-decoration: none; color: hsl(var(--muted-foreground));">Documentation</a>' } },
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
                  text: "Company",
                  level: 4,
                  fontWeight: "bold",
                  marginBottom: "1rem",
                },
              },
              {
                id: "company-links-list",
                type: "div",
                properties: { display: "flex", flexDirection: "column", gap: "0.5rem" },
                children: [
                  { id: "link-about", type: "text", properties: { text: '<a href="#" style="text-decoration: none; color: hsl(var(--muted-foreground));">About Us</a>' } },
                  { id: "link-careers", type: "text", properties: { text: '<a href="#" style="text-decoration: none; color: hsl(var(--muted-foreground));">Careers</a>' } },
                  { id: "link-contact", type: "text", properties: { text: '<a href="#" style="text-decoration: none; color: hsl(var(--muted-foreground));">Contact</a>' } },
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
        borderTop: "1px solid hsl(var(--border))",
        paddingTop: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: "1200px",
        marginLeft: "auto",
        marginRight: "auto",
        flexWrap: 'wrap',
        gap: '1rem',
      },
      children: [
        {
          id: "copyright-text",
          type: "text",
          properties: {
            text: "© 2024 MyApp. All rights reserved.",
            fontSize: "0.875rem",
            color: "hsl(var(--muted-foreground))",
          },
        },
      ],
    },
  ],
};
