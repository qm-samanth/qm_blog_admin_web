
import { Layout, Dropdown, Avatar, Drawer } from 'antd';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 32px', height: 56 }}
              onClick={() => onMenuChange && onMenuChange('dashboard')}
            >
              <img
                src="/logo.png"
                alt="QM Blog Admin"
                style={{ height: 60, width: 'auto', display: 'block', maxWidth: '100%' }}
              />
            </div>
            {/* Desktop Menu (custom, no AntD) */}
            <nav className="qm-desktop-menu" style={{ display: 'flex', alignItems: 'center', marginLeft: 12, gap: 8 }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  color: '#fff',
                  fontWeight: selectedMenu === 'dashboard' ? 'bold' : 'normal',
                  fontSize: 16,
                  padding: '0 18px',
                  height: 56,
                  cursor: 'pointer',
                  transition: 'border 0.2s',
                }}
                onClick={() => onMenuChange && onMenuChange('dashboard')}
                onMouseDown={e => e.preventDefault()}
              >
                Dashboard
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  color: '#fff',
                  fontWeight: selectedMenu === 'posts' ? 'bold' : 'normal',
                  fontSize: 16,
                  padding: '0 18px',
                  height: 56,
                  cursor: 'pointer',
                  transition: 'border 0.2s',
                }}
                onClick={() => onMenuChange && onMenuChange('posts')}
                onMouseDown={e => e.preventDefault()}
              >
                Posts
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  color: '#fff',
                  fontWeight: selectedMenu === 'media' ? 'bold' : 'normal',
                  fontSize: 16,
                  padding: '0 18px',
                  height: 56,
                  cursor: 'pointer',
                  transition: 'border 0.2s',
                }}
                onClick={() => onMenuChange && onMenuChange('media')}
                onMouseDown={e => e.preventDefault()}
              >
                Media
              </button>
            </nav>
          </div>
          {/* Hamburger for mobile (moved to right in mobile) */}
          <div className="qm-mobile-hamburger" style={{ display: 'none', alignItems: 'center', marginLeft: 'auto', marginRight: 16 }}>
            <button
              aria-label="Open menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>
          <Drawer
            title={<span style={{ fontWeight: 700, fontSize: 18 }}>Menu</span>}
            placement="left"
            closable={true}
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            bodyStyle={{ padding: 0 }}
            width={240}
            className="qm-mobile-drawer"
          >
            <nav style={{ display: 'flex', flexDirection: 'column', paddingTop: 16 }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#222',
                  fontWeight: selectedMenu === 'dashboard' ? 'bold' : 'normal',
                  fontSize: 16,
                  padding: '12px 24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderLeft: selectedMenu === 'dashboard' ? '3px solid #2563eb' : '3px solid transparent',
                  transition: 'border 0.2s',
                  width: '100%'
                }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onMenuChange && onMenuChange('dashboard');
                }}
              >
                Dashboard
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#222',
                  fontWeight: selectedMenu === 'posts' ? 'bold' : 'normal',
                  fontSize: 16,
                  padding: '12px 24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderLeft: selectedMenu === 'posts' ? '3px solid #2563eb' : '3px solid transparent',
                  transition: 'border 0.2s',
                  width: '100%'
                }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onMenuChange && onMenuChange('posts');
                }}
              >
                Posts
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#222',
                  fontWeight: selectedMenu === 'media' ? 'bold' : 'normal',
                  fontSize: 16,
                  padding: '12px 24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderLeft: selectedMenu === 'media' ? '3px solid #2563eb' : '3px solid transparent',
                  transition: 'border 0.2s',
                  width: '100%'
                }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onMenuChange && onMenuChange('media');
                }}
              >
                Media
              </button>
            </nav>
            <div style={{ borderTop: '1px solid #eee', margin: '16px 0 0 0', padding: '12px 0 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingLeft: 24 }}>
                <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }} size="small">
                  {username.charAt(0).toUpperCase()}
                </Avatar>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>{username}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <button
                  style={{
                    background: 'none', border: 'none', color: '#2563eb', textAlign: 'left', fontWeight: 600, fontSize: 15, padding: '10px 24px', cursor: 'pointer', width: '100%'
                  }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onMenuChange && onMenuChange('edit-profile');
                  }}
                >Edit Profile</button>
                <button
                  style={{
                    background: 'none', border: 'none', color: '#2563eb', textAlign: 'left', fontWeight: 600, fontSize: 15, padding: '10px 24px', cursor: 'pointer', width: '100%'
                  }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowChangePassword(true);
                  }}
                >Change Password</button>
                <button
                  style={{
                    background: 'none', border: 'none', color: '#d46b08', textAlign: 'left', fontWeight: 600, fontSize: 15, padding: '10px 24px', cursor: 'pointer', width: '100%'
                  }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >Logout</button>
              </div>
            </div>
          </Drawer>
        </div>
        <div className="qm-desktop-user-dropdown" style={{ paddingRight: 32 }}>
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
      <style>{`
        @media (max-width: 900px) {
          .qm-desktop-menu { display: none !important; }
          .qm-mobile-hamburger { display: flex !important; margin-left: auto !important; margin-right: 16px !important; }
          .qm-desktop-user-dropdown { display: none !important; }
        }
        @media (min-width: 901px) {
          .qm-mobile-hamburger { display: none !important; }
          .qm-desktop-user-dropdown { display: block !important; }
        }
      `}</style>
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