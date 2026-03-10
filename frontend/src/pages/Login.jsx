import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
        <div className="login-page">
            <div className="login-brand">
                <div className="login-brand-inner">
                    <div className="login-logo">ECM</div>
                    <h2>Hệ thống quản lý trung tâm Anh ngữ</h2>
                    <p>Đăng nhập để truy cập tài khoản giáo viên, học viên hoặc quản trị.</p>
                </div>
            </div>
            <div className="login-form-wrap">
                <div className="login-card">
                    <h1 className="login-title">Đăng nhập</h1>
                    <p className="login-subtitle">Nhập thông tin tài khoản của bạn</p>
                    {error && <div className="login-error" role="alert">{error}</div>}
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="login-field">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vd: admin@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="login-field">
                            <label htmlFor="password">Mật khẩu</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className={`login-submit ${isSubmitting ? 'is-loading' : ''}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>
                    <p className="login-footer">English Center Manager System · Bảo mật đăng nhập</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
