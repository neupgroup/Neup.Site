# AI Collaboration Rules

This document outlines the core technologies and library usage guidelines for the AI assistant to follow when generating or modifying code for this project.

## Core Tech Stack

The application is built on a modern, robust tech stack. Adhere to these technologies:

*   **Framework:** Next.js (using the App Router).
*   **Language:** TypeScript.
*   **UI Components:** React with ShadCN UI components.
*   **Styling:** Tailwind CSS for all styling. Do not use plain CSS files or other CSS frameworks.
*   **State Management:** Primarily use React's built-in hooks (`useState`, `useEffect`) and Context API (`useContext`).
*   **Forms:** Use `react-hook-form` for form logic and `zod` for schema validation.
*   **Database & Backend:** Firebase Firestore is the exclusive database. All backend actions are server-side functions located in `src/actions/`.
*   **Generative AI:** All AI-powered features must be implemented using Genkit.
*   **Icons:** Use the `lucide-react` library for all icons.
*   **Charts & Graphs:** Use `recharts`, as integrated with ShadCN UI.

## Library Usage Rules

To maintain consistency, please follow these specific rules for common tasks:

1.  **UI Components & Styling:**
    *   **Always** prefer using pre-existing ShadCN UI components from `@/components/ui` (e.g., `Button`, `Card`, `Input`).
    *   Combine components and style them with **Tailwind CSS utility classes**.
    *   Do **not** write custom CSS stylesheets. All styling should be inline via Tailwind classes in the JSX.
    *   Do **not** introduce new UI component libraries (e.g., Material UI, Ant Design).

2.  **Icons:**
    *   **Only** use icons from the `lucide-react` library.
    *   Before using an icon, double-check that it exists in the `lucide-react` library. Do not hallucinate icon names.

3.  **Forms:**
    *   For any form, use `react-hook-form` for managing state, validation, and submission.
    *   Define validation rules using a `zod` schema.

4.  **State Management:**
    *   For local component state, use `useState` and `useEffect`.
    *   For state that needs to be shared across multiple components, use React's Context API. The existing `ProfileProvider` is a good example.
    *   Do **not** introduce external state management libraries like Redux, Zustand, or MobX.

5.  **Data Fetching:**
    *   All communication with the Firestore database must be done through server-side **actions** located in the `src/actions/` directory.
    *   Components should call these actions to fetch or mutate data. Do not directly use Firebase SDKs within client components.

By adhering to these rules, we can ensure the codebase remains clean, consistent, and maintainable.
