import React from 'react';
import { route } from 'ziggy-js'
import { useForm, Inertia } from '@inertiajs/inertia-react';

export default function StaffLogin() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    // POST to /staff/login (matching your route name('staff.login.post'))
    post(route('staff.login.post'));
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="text-2xl mb-4">Staff Login</h1>

        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={e => setData('email', e.target.value)}
            className="border p-2 w-full"
          />
          {errors.email && (
            <div className="text-red-600 text-sm mt-1">{errors.email}</div>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={data.password}
            onChange={e => setData('password', e.target.value)}
            className="border p-2 w-full"
          />
          {errors.password && (
            <div className="text-red-600 text-sm mt-1">{errors.password}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={processing}
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          {processing ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
