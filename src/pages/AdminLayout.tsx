
import { Layout, Menu, Dropdown, Avatar } from 'antd';
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
      const [, payload] = token.split('.');
      const decoded = JSON.parse(atob(payload));
      username = decoded.username || decoded.email || 'User';
    } catch {}
  }
  return (
    <Layout style={{ minHeight: '100vh', width: '100vw' }}>
      <Header style={{ background: '#fff', padding: 0, minHeight: 56, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ color: '#001529', fontWeight: 'bold', fontSize: 20, letterSpacing: 1, padding: '0 32px' }}>
            QM Blog Admin
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedMenu]}
            style={{ borderBottom: 'none', fontSize: 16, minWidth: 500 }}
            items={[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'posts', label: 'Posts' },
              { key: 'categories', label: 'Categories' },
              { key: 'tags', label: 'Tags' },
              { key: 'authors', label: 'Authors' },
              { key: 'settings', label: 'Settings' },
            ]}
            onClick={({ key }) => onMenuChange && onMenuChange(key)}
          />
        </div>
        <div style={{ paddingRight: 32 }}>
          {onLogout && (
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="logout" onClick={onLogout} danger>
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
                <span style={{ fontWeight: 500, color: '#222' }}>{username}</span>
              </div>
            </Dropdown>
          )}
        </div>
      </Header>
      <Content style={{ margin: '0', background: '#f5f6fa', minHeight: 'calc(100vh - 112px)', width: '100%' }}>
        <div style={{ width: '100%', padding: '32px 24px 40px 24px' }}>{children}</div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        QM Blog Admin ©2025
      </Footer>
    </Layout>
  );
}
