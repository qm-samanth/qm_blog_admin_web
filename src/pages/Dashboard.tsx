import { Card, Col, Row, Statistic, List } from 'antd';
import { useEffect, useState } from 'react';
import axios from 'axios';


interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
}

interface Author {
  id: number;
  name: string;
  slug: string;
  bio: string;
  blog_posts: BlogPost[];
  user: { username: string; email: string };
}


export default function Dashboard() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
    authors: 0,
  });
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);

  // Get logged-in email from localStorage (set as username after login)
  const email = localStorage.getItem('username');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!email) {
          setLoading(false);
          return;
        }
        const res = await axios.get(
          `http://localhost:1337/api/authors?populate[0]=user&populate[1]=blog_posts&filters[user][email][$eq]=${encodeURIComponent(email)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const authorsData: Author[] = res.data.data || [];
        setAuthors(authorsData);
        // There should be only one author for the logged-in user
        const currentAuthor = authorsData[0];
        const userPosts = currentAuthor ? (currentAuthor.blog_posts || []) : [];
        setStats({
          total: userPosts.length,
          published: userPosts.filter((p: any) => p.blogstatus === 'Published').length,
          drafts: userPosts.filter((p: any) => p.blogstatus === 'Draft').length,
          scheduled: userPosts.filter((p: any) => p.blogstatus === 'Scheduled').length,
          authors: currentAuthor ? 1 : 0,
        });
        // Sort by publishedAt desc, take 5
        const sortedPosts = [...userPosts].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
        setRecentPosts(sortedPosts.slice(0, 5));
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [email]);

  return (
    <>
      <div style={{
        background: '#fff',
        padding: '24px 32px 20px 32px',
        borderRadius: 8,
        boxShadow: '0 1px 4px #e0e0e0',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        minHeight: 64,
        width: '100%'
      }}>
        <h1 style={{ fontWeight: 700, fontSize: 28, margin: 0 }}>Dashboard</h1>
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, width: '100%' }}>
        <Card bordered={false} style={{ flex: 1, boxShadow: '0 1px 4px #e0e0e0' }}><Statistic title="Total Posts" value={stats.total} loading={loading} /></Card>
        <Card bordered={false} style={{ flex: 1, boxShadow: '0 1px 4px #e0e0e0' }}><Statistic title="Published" value={stats.published} loading={loading} /></Card>
        <Card bordered={false} style={{ flex: 1, boxShadow: '0 1px 4px #e0e0e0' }}><Statistic title="Drafts" value={stats.drafts} loading={loading} /></Card>
        <Card bordered={false} style={{ flex: 1, boxShadow: '0 1px 4px #e0e0e0' }}><Statistic title="Scheduled" value={stats.scheduled} loading={loading} /></Card>
      </div>
      <Card title={<span style={{ fontWeight: 600 }}>Recent Posts</span>} loading={loading} bordered={false} style={{ marginTop: 24, boxShadow: '0 1px 4px #e0e0e0', width: '100%' }}>
        <List
          dataSource={recentPosts.length > 0 ? recentPosts : [{ id: 0, title: 'Demo Post', slug: '', content: '', publishedAt: '' }]}
          locale={{ emptyText: 'No recent posts' }}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<span style={{ fontWeight: 500 }}>{item.title}</span>}
                description={<span style={{ color: '#888' }}>{`Published: ${item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'N/A'}`}</span>}
              />
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}
