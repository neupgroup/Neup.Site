# **App Name**: Neup.Sites

## Core Features:

- Drag and Drop Interface: Enable users to visually build web pages by dragging and dropping elements onto a canvas.
- Content Blocks: Offer a variety of pre-designed content blocks (text, images, buttons, etc.) that can be added to the page.
- Section Templates: Provide a library of pre-designed section templates to quickly create common page layouts.
- Element Styling: Allow users to customize the styles of elements (colors, fonts, padding, etc.).
- AI-Powered Design Assistant: An AI tool that provides suggestions for design improvements, such as optimal color combinations and font pairings, based on the current design and desired aesthetic. This tool analyzes the user's design choices and offers recommendations to enhance the visual appeal and user experience, helping users to create professional-looking websites more efficiently.
- Live Preview: Provide a live preview mode to view the website as it will appear to visitors.
- Page Management: Enable users to create, delete, and manage multiple pages within their website.

## Style Guidelines:

- Primary color: Soft teal (#64C5CF) to invoke a sense of calmness and innovation.
- Background color: Light gray (#F5F5F5) for a clean and modern backdrop.
- Accent color: Dark teal (#2A9D8F) to highlight interactive elements and calls to action.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines and 'Inter' (sans-serif) for body text, for a contemporary feel.
- Minimalist layout with ample whitespace to create a clean and uncluttered user interface.
- Use a set of modern, line-based icons to represent common actions and content types.
- Subtle animations and transitions to enhance the user experience without being distracting.

## Architectural Rules:

- **Schemas**: All schema definitions for the application must be located in the `src/schemas` directory. Each schema should be in its own file, named according to its context and scope (e.g., `user.ts`, `product.ts`). This ensures a single source of truth for all data structures and prevents schema definitions from being scattered throughout the codebase.