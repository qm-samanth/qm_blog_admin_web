
import { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import axios from 'axios';


interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
  categories?: any;
  tags?: any;
  localizations?: any;
  status?: string;
  seo?: any;
  // Add any other fields you want to support
}


export default function Posts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  // Removed unused form/edit state
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAuthorAndPosts();
    // eslint-disable-next-line
  }, []);


  // Fetch author id first, then fetch posts for that author
  const fetchAuthorAndPosts = async () => {
    setLoading(true);
    try {
      // 1. Get author id for current user
      const authorRes = await axios.get('http://localhost:1337/api/authors?populate=user', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const authors = authorRes.data.data || [];
      const currentAuthor = authors.find((a: any) => a.user && (a.user.username === username || a.user.email === username));
      const authorId = currentAuthor ? currentAuthor.id : null;
      if (!authorId) {
        setPosts([]);
        setLoading(false);
        return;
      }
      // 2. Fetch posts for this author
      const postsRes = await axios.get(`http://localhost:1337/api/blog-posts?populate=authors&filters[authors][id]=${authorId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const postsData = postsRes.data.data || [];
      // Map API response to BlogPost[] and sort by publishedAt descending (latest first)
      const mappedPosts = postsData.map((p: any) => {
        const docId = (p.documentId || p.attributes?.documentId || p.id || p.attributes?.id);
        return {
          id: p.id,
          documentId: docId ? String(docId) : undefined,
          title: p.title || p.attributes?.title,
          slug: p.slug || p.attributes?.slug,
          content: p.content || p.attributes?.content,
          publishedAt: p.publishedAt || p.attributes?.publishedAt,
        };
      });
      mappedPosts.sort((a, b) => {
        // If publishedAt is missing, treat as oldest
        if (!a.publishedAt && !b.publishedAt) return 0;
        if (!a.publishedAt) return 1;
        if (!b.publishedAt) return -1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
      setPosts(mappedPosts);
    } catch (e) {
      message.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (documentId: string) => {
    if (!documentId) {
      message.error('Invalid post identifier');
      return;
    }
    try {
      await axios.delete(`http://localhost:1337/api/blog-posts/${documentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      message.success('Post deleted');
      fetchAuthorAndPosts();
    } catch (e) {
      message.error('Failed to delete post');
    }
  };



  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <b>{text}</b>,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Published',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (date: string) => date ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BlogPost & { documentId?: string }) => {
        // Always use documentId as string, fallback to id as string
        const docId = record.documentId || String(record.id);
        return (
          <Space>
            {/* Edit button removed */}
            <Popconfirm title="Delete this post?" onConfirm={() => handleDelete(docId)} okText="Yes" cancelText="No">
              <Button type="link" danger>Delete</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];



  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>My Posts</h2>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => { setEditingPost(null); setFormVisible(true); }}>
        New Post
      </Button>
      <Table
        columns={columns}
        dataSource={posts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      
    </div>
  );
}