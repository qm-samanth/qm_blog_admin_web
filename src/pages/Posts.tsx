
import { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';


interface BlogPost {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  content: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  blogstatus?: string;
  categories?: any;
  tags?: any;
  localizations?: any;
  status?: string;
  seo?: any;
}


export default function Posts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  // Removed unused form/edit state
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAuthorAndPosts();
    // eslint-disable-next-line
  }, []);


  // Fetch author documentId first, then fetch posts for that author
  const fetchAuthorAndPosts = async () => {
    setLoading(true);
    try {
      // 1. Get author info for current user
      const authorRes = await axios.get('http://localhost:1337/api/authors?populate=user', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const authors = authorRes.data.data || [];
      const currentAuthor = authors.find((a: any) => a.user && (a.user.username === username || a.user.email === username));
      const authorDocumentId = currentAuthor ? currentAuthor.documentId : null;
      if (!authorDocumentId) {
        setPosts([]);
        setLoading(false);
        return;
      }
      // 2. Fetch published posts for this author
      const publishedPromise = axios.get(
        `http://localhost:1337/api/blog-posts?populate=authors&status=published&filters[authors][documentId][$eq]=${authorDocumentId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      // 3. Fetch draft posts for this author
      const draftPromise = axios.get(
        `http://localhost:1337/api/blog-posts?populate=authors&status=draft&filters[authors][documentId][$eq]=${authorDocumentId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      // Wait for both
      const [publishedRes, draftRes] = await Promise.all([publishedPromise, draftPromise]);
      const publishedData = (publishedRes.data.data || publishedRes.data.body?.data || []);
      const draftData = (draftRes.data.data || draftRes.data.body?.data || []);
      // Merge by documentId, keeping only the one with the latest datetime (publishedAt or updatedAt)
      const postsByDocId: { [docId: string]: any } = {};
      const allPosts = [...publishedData, ...draftData];
      allPosts.forEach((p: any) => {
        const docId = p.documentId;
        const prev = postsByDocId[docId];
        // Get latest datetime for this post
        const getLatest = (post: any) => {
          const pub = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
          const upd = post.updatedAt ? new Date(post.updatedAt).getTime() : 0;
          return Math.max(pub, upd);
        };
        if (!prev) {
          postsByDocId[docId] = p;
        } else {
          // If this post is newer, replace
          if (getLatest(p) > getLatest(prev)) {
            postsByDocId[docId] = p;
          }
        }
      });
      const mappedPosts = Object.values(postsByDocId).map((p: any) => ({
        id: p.id,
        documentId: p.documentId,
        title: p.title,
        slug: p.slug,
        content: p.content,
        publishedAt: p.publishedAt,
        updatedAt: p.updatedAt,
        blogstatus: p.blogstatus,
      }));
      mappedPosts.sort((a: BlogPost, b: BlogPost) => {
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



  // Helper to format date to Indian 12-hour format
  const formatIndianDateTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
      title: 'Status',
      dataIndex: 'publishedAt',
      key: 'status',
      render: (_: any, record: BlogPost) =>
        !record.publishedAt
          ? <Tag color="orange">Draft</Tag>
          : <Tag color="green">Published</Tag>,
    },
    {
      title: 'Published At',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (date: string) => formatIndianDateTime(date),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => formatIndianDateTime(date),
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
              <Button type="text" icon={<DeleteOutlined style={{ color: '#0066e6', fontSize: 18 }} />} />
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