
import { useState, useEffect } from 'react';
import AdminLayout from './pages/AdminLayout';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import EditProfile from './pages/EditProfile';
import PostForm from './pages/PostForm';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import API_BASE_URL from './apiConfig';
import 'antd/dist/reset.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);



  // Logout handler (declare first)
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  // Check for token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Check if token is expired before authenticating
      try {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));
        if (decoded.exp && Date.now() / 1000 > decoded.exp) {
          handleLogout();
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        handleLogout();
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  

  // JWT expiration check (must be before any return)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));
        if (decoded.exp && Date.now() / 1000 > decoded.exp) {
          handleLogout();
          message.warning('Session expired. Please log in again.');
        }
      } catch (e) {
        // Invalid token, force logout
        handleLogout();
      }
    }
  }, [isAuthenticated]);


  const onFinish = async (values: { identifier: string; password: string }) => {
    setLoading(true);
    setLoginError(null);
    try {
      // Replace with your Strapi backend URL
      const res = await axios.post(`${API_BASE_URL}/auth/local`, {
        identifier: values.identifier,
        password: values.password,
      });
      if (res.data && res.data.jwt) {
        localStorage.setItem('token', res.data.jwt);
        if (res.data.user && res.data.user.username) {
          localStorage.setItem('username', res.data.user.username);
        }
        setIsAuthenticated(true);
        message.success('Login successful!');
      } else {
        setLoginError('No token received.');
        message.error('No token received.');
      }
    } catch (err: any) {
      setLoginError(err?.response?.data?.error?.message || 'Login failed');
      message.error(err?.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };



  // Simple client-side routing for menu navigation
  type PageState =
    | { page: 'dashboard' }
    | { page: 'posts' }
    | { page: 'edit-profile' }
    | { page: 'post-form'; documentId?: string };
  const [page, setPage] = useState<PageState>({ page: 'dashboard' });

  // Listen for dashboard-edit-profile event to trigger navigation
  useEffect(() => {
    const handler = () => setPage({ page: 'edit-profile' });
    window.addEventListener('dashboard-edit-profile', handler);
    return () => window.removeEventListener('dashboard-edit-profile', handler);
  }, []);

  let content;
  if (!isAuthenticated) {
    content = (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#f5f6f8',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Blue top half background with large QUALMINDS BLOG text */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '45vh',
          minHeight: 260,
          background: 'linear-gradient(180deg, #0066e6 0%, #0a5ad5 100%)',
          zIndex: 1,
          overflow: 'hidden',
        }}>
          {/* Large faded QUALMINDS BLOG text */}
          <div style={{
            position: 'absolute',
            top: '28%', // moved up further from 38%
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            <div style={{
              fontSize: 'clamp(32px, 8vw, 80px)',
              fontWeight: 900,
              color: '#fff',
              opacity: 0.2,
              letterSpacing: 4,
              whiteSpace: 'nowrap',
            }}>
              QUALMINDS BLOG
            </div>
            <div style={{
              fontSize: 'clamp(18px, 2.5vw, 28px)',
              fontStyle: 'italic',
              fontFamily: '"Dancing Script", cursive',
              color: '#fff',
              opacity: 0.2,
              marginTop: -12,
              fontWeight: 400,
              letterSpacing: 1,
              whiteSpace: 'nowrap',
              maxWidth: 1000,
              marginLeft: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}>
              Unlock your potential and discover the power of knowledge in every post
              {/* Google Fonts: Dancing Script */}
              <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet" />
            </div>
            
          </div>
          {/* Optional: Large faded triangle background */}
          <svg width="100%" height="100%" viewBox="0 0 1200 400" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}>
            <polygon points="600,40 1100,400 100,400" fill="#fff" />
          </svg>
        </div>
        {/* Login card */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          maxWidth: 400,
          width: '90vw',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          padding: '40px 32px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#0066e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              {/* Simple triangle icon */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#fff" />
                <polygon points="16,8 24,24 8,24" fill="#0066e6" />
              </svg>
            </div>
          </div>
          <div style={{
            fontWeight: 600,
            fontSize: 18,
            color: '#0066e6',
            marginBottom: 24,
            textAlign: 'center',
            letterSpacing: 0.5,
            }}>
            <span style={{
              fontWeight: 400,
              fontSize: 18,
              color: '#0066e6',
              letterSpacing: 0.5,
            }}>
              QUALMINDS
             </span>
            </div>
          <Form layout="vertical" onFinish={onFinish} autoComplete="off" style={{ width: '100%' }}>
            <Form.Item name="identifier" label={<span style={{ color: '#888' }}>Email</span>} rules={[{ required: true, message: 'Please input your email!' }]}> 
              <Input autoFocus size="large" style={{ borderRadius: 4 }} />
            </Form.Item>
            <Form.Item name="password" label={<span style={{ color: '#888' }}>Password</span>} rules={[{ required: true, message: 'Please input your password!' }]}> 
              <Input.Password size="large" style={{ borderRadius: 4 }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit" block loading={loading} size="large" style={{ borderRadius: 4, background: '#0066e6' }}>
                LOGIN
              </Button>
            </Form.Item>
            
            {loginError && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{loginError}</div>}
          </Form>
        </div>
        {/* Footer */}
        <div style={{
          color: '#888',
          fontSize: 12,
          marginTop: 48,
          textAlign: 'center',
          width: '100%',
          position: 'absolute',
          bottom: 24,
          left: 0,
          zIndex: 1,
        }}>
          © {new Date().getFullYear()} <a href="https://qualminds.com/" style={{ color: 'inherit', textDecoration: 'none' }}>QualMinds Technologies Pvt. Ltd.</a><br />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <a href="https://www.facebook.com/qualminds" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="22" height="22" fill="#888" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
            </a>
            <a href="https://www.linkedin.com/company/qualminds/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="22" height="22" fill="#888" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11.75 20h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.25 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/></svg>
            </a>
            <a href="https://twitter.com/qualminds" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg width="22" height="22" fill="#888" viewBox="0 0 24 24"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.117 2.823 5.254a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.058 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z"/></svg>
            </a>
            <a href="https://www.glassdoor.co.in/Overview/Working-at-QualMinds-EI_IE1285210.11,20.htm" target="_blank" rel="noopener noreferrer" aria-label="Glassdoor">
              <svg width="22" height="22" fill="#888" viewBox="0 0 24 24"><path d="M21.5 0h-19C1.119 0 0 1.119 0 2.5v19C0 22.881 1.119 24 2.5 24h19c1.381 0 2.5-1.119 2.5-2.5v-19C24 1.119 22.881 0 21.5 0zM2.5 1.5h19c.552 0 1 .448 1 1v2.5h-21V2.5c0-.552.448-1 1-1zm19 21h-19c-.552 0-1-.448-1-1v-2.5h21V21.5c0 .552-.448 1-1 1zm1-5.5h-21v-8h21v8z"/></svg>
            </a>
          </div>
        </div>
      </div>
    );
  } else {
    let selectedMenu = 'dashboard';
    if (page.page === 'posts' || page.page === 'post-form') selectedMenu = 'posts';
    if (page.page === 'edit-profile') selectedMenu = 'edit-profile';
    content = (
      <AdminLayout
        onLogout={handleLogout}
        selectedMenu={selectedMenu}
        onMenuChange={(key) => {
          if (key === 'dashboard') setPage({ page: 'dashboard' });
          if (key === 'posts') setPage({ page: 'posts' });
          if (key === 'edit-profile') setPage({ page: 'edit-profile' });
        }}
      >
        {page.page === 'dashboard' && <Dashboard />}
        {page.page === 'posts' && (
          <Posts
            onAddPost={() => setPage({ page: 'post-form' })}
            onEditPost={(documentId: string) => setPage({ page: 'post-form', documentId })}
          />
        )}
        {page.page === 'edit-profile' && <EditProfile />}
        {page.page === 'post-form' && (
          <PostForm 
            documentId={page.documentId}
            onSuccess={() => setPage({ page: 'posts' })}
          />
        )}
      </AdminLayout>
    );
  }

  return content;
}

export default App;