
import { Layout, Menu, Dropdown, Avatar, Popconfirm } from 'antd';
import React, { useState } from 'react';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { CaretDownFilled } from '@ant-design/icons';
import type { ReactNode } from 'react';

const { Header, Content, Footer, Sider } = Layout;

interface AdminLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export default function AdminLayout({ children, onLogout, selectedMenu = 'dashboard', onMenuChange }: AdminLayoutProps & { selectedMenu?: string, onMenuChange?: (key: string) => void }) {
  // Extract username from JWT in localStorage
  let username = 'User';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      
      username = localStorage.getItem('username') || 'User';
    } catch {}
  }
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', width: '100vw' }}>
      <Header style={{
        background: '#0066e6',
        padding: 0,
        minHeight: 56,
        height: 56,
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 32px', height: 56 }}
            onClick={() => onMenuChange && onMenuChange('dashboard')}
          >
            <img
              src="https://qualminds.com/images/QM_logo.png"
              alt="QM Blog Admin"
              style={{ height: 16, width: 'auto', display: 'block' }}
            />
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedMenu]}
            style={{ borderBottom: 'none', fontSize: 16, minWidth: 500, background: 'transparent' }}
            items={[
              { key: 'dashboard', label: <span style={{ color: '#fff', fontWeight: selectedMenu === 'dashboard' ? 'bold' : 'normal' }}>Dashboard</span> },
              { key: 'posts', label: <span style={{ color: '#fff', fontWeight: selectedMenu === 'posts' ? 'bold' : 'normal' }}>Posts</span> },
            ]}
            onClick={({ key }) => onMenuChange && onMenuChange(key)}
          />
        </div>
        <div style={{ paddingRight: 32 }}>
          {onLogout && (
            <>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit-profile',
                      label: <span style={{ color: '#0066e6', fontWeight: 600 }}>Edit Profile</span>,
                      onClick: () => onMenuChange && onMenuChange('edit-profile'),
                    },
                    {
                      key: 'change-password',
                      label: <span style={{ color: '#0066e6', fontWeight: 600 }}>Change Password</span>,
                      onClick: () => setShowChangePassword(true),
                    },
                    {
                      key: 'logout',
                      label: <span style={{ color: '#0066e6', fontWeight: 600 }}>Logout</span>,
                      onClick: () => setShowLogoutConfirm(true),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                  <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }} size="small">
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                  <span style={{ fontWeight: 500, color: '#fff' }}>{username}</span>
                  <CaretDownFilled style={{ color: '#fff', fontSize: 14, marginLeft: 2 }} />
                </div>
              </Dropdown>
              {showLogoutConfirm && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: 2000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(30, 41, 80, 0.18)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
                    padding: '36px 32px 28px 32px',
                    minWidth: 420,
                    maxWidth: 520,
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 20, color: '#222', marginBottom: 18 }}>Are you sure you want to logout?</div>
                    <div style={{ display: 'flex', gap: 18, marginTop: 8 }}>
                      <button
                        style={{
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 16,
                          padding: '2.5px 20px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px 0 rgba(37,99,235,0.08)'
                        }}
                        onClick={() => {
                          setShowLogoutConfirm(false);
                          if (onLogout) onLogout();
                        }}
                      >
                        Yes, Logout
                      </button>
                      <button
                        style={{
                          background: '#f3f4f6',
                          color: '#222',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 16,
                          padding: '2.5px 20px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'
                        }}
                        onClick={() => setShowLogoutConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Header>
      <ChangePasswordModal visible={showChangePassword} onClose={() => setShowChangePassword(false)} onLogout={onLogout} />
      <Content style={{
        margin: '0',
        background: '#f5f6fa',
        minHeight: 'calc(100vh - 112px)',
        width: '100%',
        marginTop: 56
      }}>
        <div style={{ width: '100%', padding: '32px 24px 40px 24px' }}>{children}</div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        QM Blog Admin ©2025
      </Footer>
    </Layout>
  );
}