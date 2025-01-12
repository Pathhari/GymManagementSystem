// resources/js/app.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/inertia-react';
import { route } from 'ziggy-js'; // for Reactwindow.route = route; 
// or attach to global

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    return pages[`./Pages/${name}.jsx`];
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
