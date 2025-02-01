<<<<<<< HEAD
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import 'tw-elements-react/dist/css/tw-elements-react.min.css';
import { route } from 'ziggy-js';

axios.defaults.withCredentials = true;
=======
import { Inertia } from '@inertiajs/inertia-react'; // Correct import
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import 'tw-elements-react/dist/css/tw-elements-react.min.css';
import { route } from 'ziggy-js';
>>>>>>> 7b8fa76 (admin staff temporary)

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
