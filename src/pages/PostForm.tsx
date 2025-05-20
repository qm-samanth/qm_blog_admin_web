import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, Checkbox, Row, Col, Spin } from 'antd';
import axios from 'axios';

const { TextArea } = Input;

interface PostFormProps {
  documentId?: string; // If present, edit mode
}

const PostForm: React.FC<PostFormProps> = ({ documentId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  useEffect(() => {
    fetchMeta();
    if (documentId) {
      fetchPost();
    } else {
      fetchCurrentAuthor();
    }
    // eslint-disable-next-line
  }, [documentId]);

  const fetchMeta = async () => {
    // Fetch categories, tags, authors
    try {
      const [catRes, tagRes, authorRes] = await Promise.all([
        axios.get('http://localhost:1337/api/categories', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        axios.get('http://localhost:1337/api/tags', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        axios.get('http://localhost:1337/api/authors', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ]);
      setCategories(catRes.data.data || []);
      setTags(tagRes.data.data || []);
      setAuthors(authorRes.data.data || []);
    } catch (e) {
      // No notification per user preference
    }
  };

  const fetchCurrentAuthor = async () => {
    // Prefill authors with current user
    try {
      const authorRes = await axios.get('http://localhost:1337/api/authors?populate=user', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const authorsArr = authorRes.data.data || [];
      const currentAuthor = authorsArr.find((a: any) => a.user && (a.user.username === username || a.user.email === username));
      if (currentAuthor) {
        setInitialValues((prev: any) => ({ ...prev, authors: [currentAuthor.documentId] }));
      }
    } catch (e) {}
  };

  const fetchPost = async () => {
    setLoading(true);
    try {
      // Fetch by documentId (Strapi returns array, but we want the first match)
      const res = await axios.get(`http://localhost:1337/api/blog-posts?filters[documentId][$eq]=${documentId}&populate=*`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = res.data.data?.[0] || {};
      // Flatten Strapi response if needed
      setInitialValues({
        ...data,
        authors: Array.isArray(data.authors) ? data.authors.map((a: any) => a.documentId || a.id) : [],
        categories: Array.isArray(data.categories) ? data.categories.map((c: any) => c.documentId || c.id) : [],
        tags: Array.isArray(data.tags) ? data.tags.map((t: any) => t.documentId || t.id) : [],
        json_ld: data.json_ld ? JSON.stringify(data.json_ld, null, 2) : '',
      });
      // Set form fields directly if form is ready
      form.setFieldsValue({
        ...data,
        authors: Array.isArray(data.authors) ? data.authors.map((a: any) => a.documentId || a.id) : [],
        categories: Array.isArray(data.categories) ? data.categories.map((c: any) => c.documentId || c.id) : [],
        tags: Array.isArray(data.tags) ? data.tags.map((t: any) => t.documentId || t.id) : [],
        json_ld: data.json_ld ? JSON.stringify(data.json_ld, null, 2) : '',
      });
    } catch (e) {}
    setLoading(false);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Parse JSON-LD
      let json_ld = undefined;
      if (values.json_ld) {
        try { json_ld = JSON.parse(values.json_ld); } catch { json_ld = undefined; }
      }
      const payload = {
        ...values,
        json_ld,
      };
      if (documentId) {
        await axios.put(`http://localhost:1337/api/blog-posts/${documentId}?status=draft`, { data: payload }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      } else {
        await axios.post('http://localhost:1337/api/blog-posts?status=draft', { data: payload }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      }
      // No notification per user preference
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: '100%' }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>{documentId ? 'Edit Post' : 'Add New Post'}</h2>
      <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px #e0e0e0', width: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
            style={{ width: '100%' }}
          >
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}> <Input /> </Form.Item>
                <Form.Item name="slug" label="Slug" rules={[{ required: true, message: 'Slug is required' }]}> <Input /> </Form.Item>
                <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Content is required' }]}> <TextArea rows={6} /> </Form.Item>
                <Form.Item name="excerpt" label="Excerpt"> <TextArea rows={2} /> </Form.Item>
                <Form.Item name="views" label="Views"><Input type="number" disabled={!documentId} /></Form.Item>
                <Form.Item name="likes" label="Likes"><Input type="number" disabled={!documentId} /></Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="categories" label="Categories">
                  <Select mode="multiple" options={categories.map(c => ({ label: c.name || c.title, value: c.documentId || c.id }))} />
                </Form.Item>
                <Form.Item name="tags" label="Tags">
                  <Select mode="multiple" options={tags.map(t => ({ label: t.name || t.title, value: t.documentId || t.id }))} />
                </Form.Item>
                <Form.Item name="meta_title" label="Meta Title"> <Input /> </Form.Item>
                <Form.Item name="meta_description" label="Meta Description"> <Input /> </Form.Item>
                <Form.Item name="canonical_url" label="Canonical URL"> <Input /> </Form.Item>
                <Form.Item name="og_title" label="OG Title"> <Input /> </Form.Item>
                <Form.Item name="og_description" label="OG Description"> <Input /> </Form.Item>
                <Form.Item name="og_image" label="OG Image URL"> <Input /> </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="twitter_title" label="Twitter Title"> <Input /> </Form.Item>
                <Form.Item name="twitter_description" label="Twitter Description"> <Input /> </Form.Item>
                <Form.Item name="twitter_image" label="Twitter Image URL"> <Input /> </Form.Item>
                <Form.Item name="noindex" valuePropName="checked"><Checkbox>Noindex</Checkbox></Form.Item>
                <Form.Item name="nofollow" valuePropName="checked"><Checkbox>Nofollow</Checkbox></Form.Item>
                <Form.Item name="json_ld" label="JSON-LD (as JSON)"><TextArea rows={4} /></Form.Item>
                <Form.Item name="authors" label="Authors">
                  <Select mode="multiple" options={authors.map(a => ({ label: a.name, value: a.documentId }))} disabled />
                </Form.Item>
                <Form.Item name="thumbnail_url" label="Thumbnail URL"> <Input /> </Form.Item>
                <Form.Item name="locale" label="Locale"> <Input /> </Form.Item>
              </Col>
            </Row>
            <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
              <Button type="primary" htmlType="submit" size="large">Save as Draft</Button>
              {/* Add publish button logic if needed */}
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
  
// (Removed duplicate/erroneous JSX block at the end)
};

export default PostForm;
