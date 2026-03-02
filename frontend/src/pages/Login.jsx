import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, enterDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        const user = res.data.user;
        if (user.role === 'teacher') navigate('/teacher/timetable');
        else if (user.role === 'student') navigate('/student/classes');
        else if (user.role === 'admin') navigate('/', { replace: true });
        else navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="size-12 text-primary">
            <span className="material-symbols-outlined text-4xl">school</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#111418] dark:text-white">EduCenter LMS</h1>
        </div>
        <div className="bg-white dark:bg-[#1a242f] rounded-2xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-4 h-10 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary/50"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-4 h-10 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            <div className="pt-4 mt-4 border-t border-[#f0f2f4] dark:border-gray-800">
              <p className="text-xs text-[#617589] dark:text-gray-400 text-center mb-3">Xem giao diện không cần đăng nhập</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { enterDemo('teacher'); navigate('/teacher/timetable'); }}
                  className="flex-1 h-10 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg">person</span>
                  Giáo viên
                </button>
                <button
                  type="button"
                  onClick={() => { enterDemo('student'); navigate('/student/classes'); }}
                  className="flex-1 h-10 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg">school</span>
                  Học sinh
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
