
import type { CanvasElementData } from "@/lib/schemas";

export const footerTemplate: CanvasElementData = {
  id: "footer-section",
  type: "section",
  styles: {
    padding: "4rem 2rem 2rem 2rem",
    backgroundColor: "hsl(var(--card))",
    borderTop: "1px solid hsl(var(--border))",
    display: "block",
  },
  children: [
    {
      id: "footer-content",
      type: "div",
      styles: {
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
          styles: {},
          children: [
            {
              id: "footer-logo-text",
              type: "heading",
              content: "MyApp",
              props: { level: 3 },
              styles: {
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
              },
            },
            {
              id: "footer-tagline",
              type: "text",
              content: "Build better, faster.",
              styles: {
                color: "hsl(var(--muted-foreground))",
              },
            },
          ],
        },
        {
          id: "footer-links-product",
          type: "div",
          styles: {},
          children: [
            {
              id: "product-heading",
              type: "heading",
              content: "Product",
              props: { level: 4 },
              styles: {
                fontWeight: "bold",
                marginBottom: "1rem",
              },
            },
            {
              id: "product-links-list",
              type: "div",
              styles: { display: "flex", flexDirection: "column", gap: "0.5rem" },
              children: [
                { id: "link-features", type: "link", content: "Features", props: { href: "#" }, styles: { textDecoration: "none", color: "hsl(var(--muted-foreground))" } },
                { id: "link-pricing", type: "link", content: "Pricing", props: { href: "#" }, styles: { textDecoration: "none", color: "hsl(var(--muted-foreground))" } },
                { id: "link-docs", type: "link", content: "Documentation", props: { href: "#" }, styles: { textDecoration: "none", color: "hsl(var(--muted-foreground))" } },
              ]
            }
          ],
        },
        {
            id: "footer-links-company",
            type: "div",
            styles: {},
            children: [
              {
                id: "company-heading",
                type: "heading",
                content: "Company",
                props: { level: 4 },
                styles: {
                  fontWeight: "bold",
                  marginBottom: "1rem",
                },
              },
              {
                id: "company-links-list",
                type: "div",
                styles: { display: "flex", flexDirection: "column", gap: "0.5rem" },
                children: [
                  { id: "link-about", type: "link", content: "About Us", props: { href: "#" }, styles: { textDecoration: "none", color: "hsl(var(--muted-foreground))" } },
                  { id: "link-careers", type: "link", content: "Careers", props: { href: "#" }, styles: { textDecoration: "none", color: "hsl(var(--muted-foreground))" } },
                  { id: "link-contact", type: "link", content: "Contact", props: { href: "#" }, styles: { textDecoration: "none", color: "hsl(var(--muted-foreground))" } },
                ]
              }
            ],
          },
      ],
    },
    {
      id: "footer-bottom",
      type: "div",
      styles: {
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
          content: "© 2024 MyApp. All rights reserved.",
          styles: {
            fontSize: "0.875rem",
            color: "hsl(var(--muted-foreground))",
          },
        },
      ],
    },
  ],
};
