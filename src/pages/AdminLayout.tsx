
import { Layout, Menu, Dropdown, Avatar } from 'antd';
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
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, letterSpacing: 1, padding: '0 32px' }}>
            QM Blog Admin
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
            <Dropdown
              overlay={
                <Menu onClick={({ key }) => {
                  if (key === 'logout') onLogout();
                  if (key === 'edit-profile' && onMenuChange) onMenuChange('edit-profile');
                  if (key === 'change-password') setShowChangePassword(true);
                }}>
                  <Menu.Item key="edit-profile" style={{ color: '#0066e6', fontWeight: 600 }}>
                    Edit Profile
                  </Menu.Item>
                  <Menu.Item key="change-password" style={{ color: '#0066e6', fontWeight: 600 }}>
                    Change Password
                  </Menu.Item>
                  <Menu.Item key="logout" style={{ color: '#0066e6', fontWeight: 600 }}>
                    Logout
                  </Menu.Item>
                </Menu>
              }
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