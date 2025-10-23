import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../src/contexts/AuthContext'



export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  // Pre-fill with developer default credentials to make login quick
  const [username, setUsername] = useState('0000');
  const [password, setPassword] = useState('0000');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(username, password)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard')
      } else {
        setError('Invalid credentials')
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-800 dark:text-slate-300 font-semibold">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border-2 border-red-300 dark:border-red-800">
              <div className="text-sm text-red-800 dark:text-red-400 font-semibold">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-slate-400 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-slate-400 dark:border-slate-600 placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 shadow-lg"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-white/90 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              Sign in
            </button>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold">
              Quick login: <span className="font-mono font-extrabold text-blue-700 dark:text-blue-400">0000</span>
              {' / '}
              <span className="font-mono font-extrabold text-blue-700 dark:text-blue-400">0000</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}