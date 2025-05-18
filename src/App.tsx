import { useState, useEffect } from 'react';
import AdminLayout from './pages/AdminLayout';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
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
      const res = await axios.post('http://localhost:1337/api/auth/local', {
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
  const [page, setPage] = useState<'dashboard' | 'posts'>('dashboard');

  let content;
  if (!isAuthenticated) {
    content = (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <div style={{ width: 320, padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
          <h2 style={{ textAlign: 'center' }}>Admin Login</h2>
          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item name="identifier" label="Email or Username" rules={[{ required: true, message: 'Please input your email or username!' }]}> 
              <Input autoFocus />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please input your password!' }]}> 
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Log in
              </Button>
            </Form.Item>
            {loginError && <div style={{ color: 'red', marginTop: 8 }}>{loginError}</div>}
          </Form>
        </div>
      </div>
    );
  } else {
    content = (
      <AdminLayout onLogout={handleLogout}>
        <MenuBar page={page} setPage={setPage} />
        {page === 'dashboard' && <Dashboard />}
        {page === 'posts' && <Posts />}
      </AdminLayout>
    );
  }

  return content;

// MenuBar component for navigation
function MenuBar({ page, setPage }: { page: string; setPage: (p: 'dashboard' | 'posts') => void }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Button type={page === 'dashboard' ? 'primary' : 'default'} onClick={() => setPage('dashboard')}>Dashboard</Button>
        <Button type={page === 'posts' ? 'primary' : 'default'} onClick={() => setPage('posts')}>Posts</Button>
      </div>
    </div>
  );
}

 
  // JWT expiration check (optional, basic)
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

  return (
    <AdminLayout onLogout={handleLogout}>
      <h2>Dashboard</h2>
      <Dashboard />
    </AdminLayout>
  );
}

export default App;

