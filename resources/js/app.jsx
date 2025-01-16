// resources/js/app.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react'; // Correct adapter
import 'tw-elements-react/dist/css/tw-elements-react.min.css';
import { route } from 'ziggy-js'; // For React

// Attach Ziggy's `route` function to the global `window` object
window.route = route;

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    return pages[`./Pages/${name}.jsx`];
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
