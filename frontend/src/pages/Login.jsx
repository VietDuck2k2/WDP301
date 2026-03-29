import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Vui lòng nhập email và mật khẩu.');
            return;
        }
        setIsSubmitting(true);
        const result = await login(email, password);
        setIsSubmitting(false);
        if (result.success) {
            if (result.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate(`/${result.role}/timetable`);
            }
        } else {
            setError(result.message || 'Email hoặc mật khẩu không đúng.');
        }
    };

    return (
        <main className="flex h-screen w-full bg-surface font-body text-on-surface antialiased overflow-hidden">
            {/* Left Section: High-Impact Visual */}
            <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
                <div className="absolute inset-0 z-0 opacity-80">
                    <img 
                        alt="Library Interior" 
                        className="w-full h-full object-cover" 
                        src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2670&auto=format&fit=crop" 
                    />
                </div>
                {/* Overlay Gradient for Brand Presence */}
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/80 to-primary-container/95 mix-blend-multiply"></div>
                <div className="relative z-20 flex flex-col justify-between p-16 w-full text-white">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                        <span className="font-headline font-bold text-3xl tracking-tight">Scholarly</span>
                    </div>
                    <div className="max-w-md">
                        <h1 className="font-headline text-5xl font-extrabold leading-tight tracking-tight mb-6">
                            Nâng tầm tri thức Anh ngữ.
                        </h1>
                        <p className="text-on-primary-container text-xl font-light leading-relaxed">
                            Tham gia cộng đồng học thuật ưu tú với hệ thống quản lý đào tạo tiên tiến và thông minh nhất.
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="h-px w-12 bg-on-primary-container/30"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-on-primary-container/70">English Center Manager System</span>
                    </div>
                </div>
            </section>

            {/* Right Section: Login Form */}
            <section className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 lg:px-24 bg-surface relative overflow-y-auto">
                <div className="w-full max-w-md my-auto py-12">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-12">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                            <span className="font-headline font-bold text-2xl tracking-tight">Scholarly</span>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,55,176,0.06)] border border-outline-variant/20 relative z-10">
                        <div className="mb-10 text-left">
                            <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-2">Chào mừng trở lại</h2>
                            <p className="text-on-surface-variant font-medium">Đăng nhập tài khoản để truy cập hệ thống.</p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3 border border-red-200">
                                <span className="material-symbols-outlined mt-0.5">error</span>
                                <span className="font-medium text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="font-bold text-xs uppercase tracking-wider text-on-surface-variant block ml-1" htmlFor="email">
                                    Địa chỉ Email
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-surface-container-lowest transition-all duration-300 placeholder:text-outline/50 text-on-surface font-medium outline-none" 
                                        id="email" 
                                        name="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="vd: admin@example.com" 
                                        required 
                                        type="email"
                                        autoComplete="email"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="font-bold text-xs uppercase tracking-wider text-on-surface-variant block" htmlFor="password">
                                        Mật khẩu
                                    </label>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-transparent rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-surface-container-lowest transition-all duration-300 placeholder:text-outline/50 text-on-surface font-medium outline-none" 
                                        id="password" 
                                        name="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        required 
                                        type="password"
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full mt-8 py-3.5 px-6 bg-primary text-white font-headline font-bold text-base rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:shadow-primary/20 hover:bg-primary-container flex justify-center items-center group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><span className="material-symbols-outlined animate-spin mr-2">sync</span> Đang đăng nhập...</>
                                ) : (
                                    <>
                                        Đăng nhập
                                        <span className="material-symbols-outlined ml-2 transition-transform group-hover:translate-x-1 text-[20px]">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <footer className="mt-12 text-center text-on-surface-variant/60 text-xs font-medium pb-6">
                        <p>© {new Date().getFullYear()} Cung cấp bởi Scholarly English Center.</p>
                        <div className="flex justify-center gap-4 mt-2">
                            <a className="hover:text-primary transition-colors" href="#">Trợ giúp</a>
                            <a className="hover:text-primary transition-colors" href="#">Bảo mật</a>
                        </div>
                    </footer>
                </div>
            </section>
        </main>
    );
};

export default Login;
