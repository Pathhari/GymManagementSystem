// resources/js/app.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/inertia-react';

createInertiaApp({
  // The page name => page component resolution
  // Typically, we do dynamic imports like:
  resolve: name => import(`./Pages/${name}.jsx`), 
    setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
