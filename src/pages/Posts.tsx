
import { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';


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

interface PostsProps {
  onAddPost?: () => void;
  onEditPost?: (documentId: string) => void;
}

export default function Posts({ onAddPost, onEditPost }: PostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
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
      const authorRes = await axios.get(`${API_BASE_URL}/authors?populate=user`, {
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
        `${API_BASE_URL}/blog-posts?populate=authors&status=published&filters[authors][documentId][$eq]=${authorDocumentId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      // 3. Fetch draft posts for this author
      const draftPromise = axios.get(
        `${API_BASE_URL}/blog-posts?populate=authors&status=draft&filters[authors][documentId][$eq]=${authorDocumentId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      // Wait for both
      const [publishedRes, draftRes] = await Promise.all([publishedPromise, draftPromise]);
      const publishedData = (publishedRes.data.data || publishedRes.data.body?.data || []);
      const draftData = (draftRes.data.data || draftRes.data.body?.data || []);
      // Count documentId occurrences across both lists
      const allPosts = [...publishedData, ...draftData];
      const docIdCounts: { [docId: string]: number } = {};
      allPosts.forEach((p: any) => {
        if (p.documentId) {
          docIdCounts[p.documentId] = (docIdCounts[p.documentId] || 0) + 1;
        }
      });

      // For each documentId, if it appears only once, use as is. If it appears twice, merge and set status logic.
      const postsByDocId: { [docId: string]: any[] } = {};
      allPosts.forEach((p: any) => {
        if (!postsByDocId[p.documentId]) postsByDocId[p.documentId] = [];
        postsByDocId[p.documentId].push(p);
      });

      const mappedPosts = Object.entries(postsByDocId).map(([docId, postsArr]) => {
        if (postsArr.length === 1) {
          // Only one blog for this documentId
          const p = postsArr[0];
          return {
            id: p.id,
            documentId: p.documentId,
            title: p.title,
            slug: p.slug,
            content: p.content,
            publishedAt: p.publishedAt,
            updatedAt: p.updatedAt,
            blogstatus: p.blogstatus,
            _statusType: !p.publishedAt ? 'Draft' : 'Published',
          };
        } else {
          // Two blogs for this documentId, compare publishedAt and updatedAt
          const p1 = postsArr[0];
          const p2 = postsArr[1];
          // Find latest publishedAt and updatedAt
          const pub1 = p1.publishedAt ? new Date(p1.publishedAt).getTime() : 0;
          const pub2 = p2.publishedAt ? new Date(p2.publishedAt).getTime() : 0;
          const upd1 = p1.updatedAt ? new Date(p1.updatedAt).getTime() : 0;
          const upd2 = p2.updatedAt ? new Date(p2.updatedAt).getTime() : 0;
          const latestPublishedAt = pub1 > pub2 ? p1.publishedAt : p2.publishedAt;
          const latestUpdatedAt = upd1 > upd2 ? p1.updatedAt : p2.updatedAt;
          // Determine status
          let _statusType = 'Published';
          if (latestUpdatedAt && latestPublishedAt) {
            if (new Date(latestUpdatedAt).getTime() > new Date(latestPublishedAt).getTime()) {
              _statusType = 'Modified';
            } else {
              _statusType = 'Published';
            }
          }
          // Use the post with the latest of publishedAt/updatedAt for display
          let displayPost = p1;
          const latestTime = Math.max(pub1, pub2, upd1, upd2);
          if (
            (p2.publishedAt && new Date(p2.publishedAt).getTime() === latestTime) ||
            (p2.updatedAt && new Date(p2.updatedAt).getTime() === latestTime)
          ) {
            displayPost = p2;
          }
          return {
            ...displayPost,
            _statusType,
          };
        }
      });
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
      await axios.delete(`${API_BASE_URL}/blog-posts/${documentId}`, {
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

  // Helper to determine status based on unique/duplicate documentId logic
  const getStatusTag = (record: BlogPost & { _statusType?: string }) => {
    if (record._statusType === 'Draft') {
      return <Tag color="orange">Draft</Tag>;
    }
    if (record._statusType === 'Modified') {
      return <Tag color="blue">Modified</Tag>;
    }
    // Default to Published
    return <Tag color="green">Published</Tag>;
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
      dataIndex: 'status',
      key: 'status',
      render: (_: any, record: BlogPost) => getStatusTag(record),
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
      render: (_: any, record: BlogPost & { documentId?: string, _statusType?: string }) => {
        // Always use documentId as string, fallback to id as string
        const docId = record.documentId || String(record.id);
        // If status is Modified, pass a query param to indicate draft
        const isModified = record._statusType === 'Modified';
        return (
          <Space>
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: '#0066e6', fontSize: 18 }} />}
                onClick={() => {
                  if (onEditPost) {
                    // Pass docId and status param if modified
                    onEditPost(isModified ? `${docId}?status=draft` : docId);
                  }
                }}
              />
            </Tooltip>
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
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => onAddPost && onAddPost()}>
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