import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!isLogin && !formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({ submit: data.error || 'Authentication failed' });
                return;
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Call parent callback
            if (onLogin) {
                onLogin(data.user);
            }
        } catch (error) {
            console.error('Auth error:', error);
            setErrors({ submit: 'Connection error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setErrors({});
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2D1B69 0%, #E20074 50%, #00A0E0 100%)',
            padding: '20px'
        }}>
            {/* Animated Background Circles */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: 0
            }}>
                <div style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    background: 'rgba(226, 0, 116, 0.3)',
                    borderRadius: '50%',
                    top: '-200px',
                    right: '-100px',
                    animation: 'float 6s ease-in-out infinite',
                    filter: 'blur(60px)'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    background: 'rgba(0, 160, 224, 0.3)',
                    borderRadius: '50%',
                    bottom: '-150px',
                    left: '-50px',
                    animation: 'float 8s ease-in-out infinite reverse',
                    filter: 'blur(60px)'
                }} />
            </div>

            {/* Auth Card */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '440px',
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                padding: '48px',
                backdropFilter: 'blur(10px)'
            }}>
                {/* Logo and Title */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                        borderRadius: '12px',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            background: 'white',
                            borderRadius: '4px'
                        }} />
                    </div>
                    <h1 style={{
                        fontSize: '28px',
                        color: 'var(--color-primary)',
                        marginBottom: '8px'
                    }}>
                        MagentaShift
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {isLogin ? 'Welcome back!' : 'Create your account'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Name Field (Register only) */}
                    {!isLogin && (
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: 'var(--color-text-main)'
                            }}>
                                Full Name
                            </label>
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <User size={20} style={{
                                    position: 'absolute',
                                    left: '16px',
                                    color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 48px',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${errors.name ? '#E20074' : 'var(--color-border)'}`,
                                        fontSize: '15px',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--color-primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(226, 0, 116, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = errors.name ? '#E20074' : 'var(--color-border)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            {errors.name && (
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#E20074' }}>
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Email Field */}
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: 'var(--color-text-main)'
                        }}>
                            Email Address
                        </label>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Mail size={20} style={{
                                position: 'absolute',
                                left: '16px',
                                color: 'var(--color-text-muted)'
                            }} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@example.com"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 48px',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${errors.email ? '#E20074' : 'var(--color-border)'}`,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--color-primary)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(226, 0, 116, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = errors.email ? '#E20074' : 'var(--color-border)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        {errors.email && (
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#E20074' }}>
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: 'var(--color-text-main)'
                        }}>
                            Password
                        </label>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Lock size={20} style={{
                                position: 'absolute',
                                left: '16px',
                                color: 'var(--color-text-muted)'
                            }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '12px 48px 12px 48px',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${errors.password ? '#E20074' : 'var(--color-border)'}`,
                                    fontSize: '15px',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--color-primary)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(226, 0, 116, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = errors.password ? '#E20074' : 'var(--color-border)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: 'var(--color-text-muted)'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#E20074' }}>
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password (Register only) */}
                    {!isLogin && (
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: 'var(--color-text-main)'
                            }}>
                                Confirm Password
                            </label>
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Lock size={20} style={{
                                    position: 'absolute',
                                    left: '16px',
                                    color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 48px',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${errors.confirmPassword ? '#E20074' : 'var(--color-border)'}`,
                                        fontSize: '15px',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--color-primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(226, 0, 116, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = errors.confirmPassword ? '#E20074' : 'var(--color-border)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#E20074' }}>
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Submit Error */}
                    {errors.submit && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(226, 0, 116, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(226, 0, 116, 0.3)',
                            color: '#E20074',
                            fontSize: '14px'
                        }}>
                            {errors.submit}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: '600',
                            background: loading
                                ? 'var(--color-text-muted)'
                                : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s',
                            transform: loading ? 'scale(0.98)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 10px 25px rgba(226, 0, 116, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }
                        }}
                    >
                        {loading ? (
                            <div style={{
                                width: '20px',
                                height: '20px',
                                border: '2px solid white',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: 'var(--color-text-muted)'
                }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={toggleMode}
                        style={{
                            color: 'var(--color-primary)',
                            fontWeight: '600',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.color = 'var(--color-primary-dark)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.color = 'var(--color-primary)';
                        }}
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>

                {/* Additional Info */}
                {!isLogin && (
                    <p style={{
                        marginTop: '20px',
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        textAlign: 'center',
                        lineHeight: '1.5'
                    }}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                )}
            </div>

            {/* Keyframe animations */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default AuthPage;
