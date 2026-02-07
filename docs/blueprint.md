# **App Name**: RetailSpark

## Core Features:

- Add Product: Form to add new products with name, price, and stock, saving them to Firestore.
- Product List: Display products in a table with options to delete and update stock, with loading and empty state handling.
- Record Sale: Select a product, enter quantity, auto-calculate the total amount, save to Firestore, and reduce product stock.
- Sales History: Display sales history in a table, handling edge cases to prevent over-selling, and manage loading states.
- Total Revenue Calculation: Calculate total revenue from sales data in Firestore and display it in a dashboard card.
- Top Selling Product: Determine the top-selling product based on sales data and display it in a dashboard card.
- Revenue Chart: Simple bar chart visualizing revenue by day, with fallback for no data.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5) for a professional and trustworthy feel.
- Background color: Very light lavender (#F5F6FA), almost white.
- Accent color: Sky blue (#03A9F4) for interactive elements and highlights.
- Body and headline font: 'Inter' sans-serif font, chosen for its modern, neutral look.
- Clean Tailwind layout with a responsive sidebar, dashboard cards, and proper spacing.
- Use modern, minimal icons for navigation and dashboard elements.
- Subtle loading indicators and transitions for a smooth user experience.