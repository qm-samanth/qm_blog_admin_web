import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, Checkbox, Row, Col, Spin, message } from 'antd';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const { TextArea } = Input;


interface PostFormProps {
  documentId?: string; // If present, edit mode
  onSuccess?: () => void; // Callback to go to post listing
}

const PostForm: React.FC<PostFormProps> = ({ documentId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  // const [dummy, setDummy] = useState(false); // no longer needed
  const [fieldsToSet, setFieldsToSet] = useState<any>(null);
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
    // Reset form state on unmount to avoid stale state after navigation
    return () => {
      setFieldsToSet(null);
      form.resetFields();
    };
  }, [documentId]);

  // No local state for title; use AntD Form only

  const fetchMeta = async () => {
    // Fetch categories, tags, authors
    try {
      const [catRes, tagRes, authorRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/categories`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        axios.get(`${API_BASE_URL}/tags`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        axios.get(`${API_BASE_URL}/authors`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
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
      const authorRes = await axios.get(`${API_BASE_URL}/authors?populate=user`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const authorsArr = authorRes.data.data || [];
      const currentAuthor = authorsArr.find((a: any) => a.user && (a.user.username === username || a.user.email === username));
      if (currentAuthor) {
        form.setFieldsValue({ authors: [currentAuthor.documentId] });
      }
    } catch (e) {}
  };

  const fetchPost = async () => {
    setLoading(true);
    try {
      // Parse status from query param if present (for modified posts)
      let statusParam = '';
      if (documentId && documentId.includes('?')) {
        const parts = documentId.split('?');
        if (parts[1]) {
          const params = new URLSearchParams(parts[1]);
          const status = params.get('status');
          if (status) {
            statusParam = `&status=${status}`;
          }
        }
      }
      // Fetch by documentId (Strapi returns array, but we want the first match)
      const docId = documentId ? documentId.split('?')[0] : '';
      const res = await axios.get(`${API_BASE_URL}/blog-posts?filters[documentId][$eq]=${docId}&populate=*${statusParam}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const raw = res.data.data?.[0] || {};
      // If Strapi v4+, fields are under attributes
      const data = raw.attributes ? { ...raw.attributes, id: raw.id, documentId: raw.documentId } : raw;
      // Debug: log the data received from API before setting form fields
      console.log('[PostForm] API response for edit:', data);
      // Reset form before setting fields to ensure clean population
      form.resetFields();
      const newFields = {
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        views: data.views || 0,
        likes: data.likes || 0,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        canonical_url: data.canonical_url || '',
        og_title: data.og_title || '',
        og_description: data.og_description || '',
        og_image: data.og_image || '',
        twitter_title: data.twitter_title || '',
        twitter_description: data.twitter_description || '',
        twitter_image: data.twitter_image || '',
        noindex: !!data.noindex,
        nofollow: !!data.nofollow,
        json_ld: data.json_ld ? JSON.stringify(data.json_ld, null, 2) : '',
        authors: Array.isArray(data.authors) ? data.authors.map((a: any) => a.documentId || a.id) : [],
        categories: Array.isArray(data.categories) ? data.categories.map((c: any) => c.documentId || c.id) : [],
        tags: Array.isArray(data.tags) ? data.tags.map((t: any) => t.documentId || t.id) : [],
        thumbnail_url: data.thumbnail_url || '',
        locale: data.locale || '',
      };
      // Debug: log the fields being set in the form
      console.log('[PostForm] Fields set in form:', newFields);
      setFieldsToSet(newFields);
      // Remove setFieldsValue; rely on initialValues and key for all fields
    } catch (e) {}
    setLoading(false);
  };

  // Save as Draft or Publish
  const onFinish = async (values: any, publish: boolean = false) => {
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
      // Always send only the intended status param
      const status = publish ? 'published' : 'draft';
      let res;
      if (documentId) {
        // Remove any query params from documentId
        const docId = documentId.split('?')[0];
        res = await axios.put(`${API_BASE_URL}/blog-posts/${docId}?status=${status}`, { data: payload }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      } else {
        res = await axios.post(`${API_BASE_URL}/blog-posts?status=${status}`, { data: payload }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      }
      // Check for error in API response
      if (res.data && res.data.error) {
        message.error(res.data.error.message || 'Failed to save post');
        setLoading(false);
        return;
      }
      message.success('Post saved successfully');
      setLoading(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      // Try to extract error message from API response
      const apiMsg = e?.response?.data?.error?.message || e?.message || 'Failed to save post';
      message.error(apiMsg);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: '100%' }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>{documentId ? 'Edit Post' : 'Add New Post'}</h2>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)',
          width: '100%',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: 'none',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : null}
        {!loading && (
          <Form
            key={documentId || 'new'}
            form={form}
            layout="vertical"
            initialValues={fieldsToSet}
            onFinish={(values) => onFinish(values, false)}
            style={{ width: '100%' }}
          >
            {/* Main Content Section */}
            <Card
              title={<span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>Main Content</span>}
              size="small"
              style={{
                marginBottom: 24,
                borderRadius: 12,
                border: 'none',
                background: '#fff',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
              }}
              headStyle={{ border: 'none', background: 'transparent', padding: '16px 24px 0 24px' }}
              bodyStyle={{ padding: 24 }}
            >
              {/* Row 1: Image preview + thumbnail_url (left), all main fields (right) */}
              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <div style={{
                    marginBottom: 16,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    borderRadius: 12,
                    padding: 24,
                    boxShadow: '0 1px 8px 0 rgba(0,0,0,0.04)',
                  }}>
                    {fieldsToSet?.thumbnail_url ? (
                      <img
                        src={fieldsToSet.thumbnail_url}
                        alt="Thumbnail Preview"
                        style={{
                          width: '100%',
                          maxWidth: 240,
                          height: 140,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid #eee',
                          background: '#fafafa',
                          margin: '0 auto 8px auto',
                          display: 'block',
                        }}
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <div style={{
                        width: 240,
                        height: 140,
                        background: '#f5f5f5',
                        border: '1px solid #eee',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bbb',
                        margin: '0 auto 8px auto',
                        fontSize: 14,
                      }}>
                        No Thumbnail
                      </div>
                    )}
                    <Form.Item name="thumbnail_url" label={<span style={{ fontWeight: 500 }}>Thumbnail URL</span>} style={{ marginBottom: 0 }}>
                      <Input
                        value={fieldsToSet?.thumbnail_url ?? ''}
                        onChange={e => setFieldsToSet((f: any) => ({ ...f, thumbnail_url: e.target.value }))}
                        placeholder="Paste or drop image URL here"
                        style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        allowClear
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xs={24} md={16}>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px 0 rgba(0,0,0,0.03)' }}>
                    <Row gutter={16} style={{ marginBottom: 0 }}>
                      <Col xs={24} md={12}>
                        <Form.Item name="title" label="Title">
                          <Input value={fieldsToSet?.title ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, title: e.target.value }))} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="slug" label="Slug">
                          <Input value={fieldsToSet?.slug ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, slug: e.target.value }))} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ marginBottom: 0 }}>
                      <Col xs={24} md={8}>
                        <Form.Item name="authors" label="Authors">
                          <Select
                            mode="multiple"
                            options={authors.map(a => ({ label: a.name, value: a.documentId }))}
                            value={fieldsToSet?.authors ?? []}
                            disabled
                            onChange={vals => setFieldsToSet((f: any) => ({ ...f, authors: vals }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name="categories" label="Categories">
                          <Select
                            mode="multiple"
                            options={categories.map(c => ({ label: c.name || c.title, value: c.documentId || c.id }))}
                            value={fieldsToSet?.categories ?? []}
                            onChange={vals => setFieldsToSet((f: any) => ({ ...f, categories: vals }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name="tags" label="Tags">
                          <Select
                            mode="multiple"
                            options={tags.map(t => ({ label: t.name || t.title, value: t.documentId || t.id }))}
                            value={fieldsToSet?.tags ?? []}
                            onChange={vals => setFieldsToSet((f: any) => ({ ...f, tags: vals }))}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Row 2: Excerpt full width */}
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={24}>
                <Form.Item name="excerpt" label={<span style={{ fontWeight: 500 }}>Excerpt</span>}>
                  <TextArea
                    rows={2}
                    value={fieldsToSet?.excerpt ?? ''}
                    onChange={e => setFieldsToSet((f: any) => ({ ...f, excerpt: e.target.value }))}
                    style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    placeholder="Short summary for preview..."
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 3: Content full width */}
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={24}>
                <Form.Item name="content" label={<span style={{ fontWeight: 500 }}>Content</span>}>
                  <TextArea
                    rows={8}
                    value={fieldsToSet?.content ?? ''}
                    onChange={e => setFieldsToSet((f: any) => ({ ...f, content: e.target.value }))}
                    style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    placeholder="Write your post content here..."
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* SEO Section */}
            <Card
              title={<span style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>SEO & Social</span>}
              size="small"
              style={{
                marginBottom: 24,
                borderRadius: 12,
                border: 'none',
                background: '#fff',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
              }}
              headStyle={{ border: 'none', background: 'transparent', padding: '16px 24px 0 24px' }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Form.Item name="meta_title" label="Meta Title">
                    <Input value={fieldsToSet?.meta_title ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, meta_title: e.target.value }))} />
                  </Form.Item>
                  <Form.Item name="meta_description" label="Meta Description">
                    <Input value={fieldsToSet?.meta_description ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, meta_description: e.target.value }))} />
                  </Form.Item>
                  <Form.Item name="canonical_url" label="Canonical URL">
                    <Input value={fieldsToSet?.canonical_url ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, canonical_url: e.target.value }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="og_title" label="OG Title">
                    <Input value={fieldsToSet?.og_title ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, og_title: e.target.value }))} />
                  </Form.Item>
                  <Form.Item name="og_description" label="OG Description">
                    <Input value={fieldsToSet?.og_description ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, og_description: e.target.value }))} />
                  </Form.Item>
                  <Form.Item name="og_image" label="OG Image URL">
                    <Input value={fieldsToSet?.og_image ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, og_image: e.target.value }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="twitter_title" label="Twitter Title">
                    <Input value={fieldsToSet?.twitter_title ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, twitter_title: e.target.value }))} />
                  </Form.Item>
                  <Form.Item name="twitter_description" label="Twitter Description">
                    <Input value={fieldsToSet?.twitter_description ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, twitter_description: e.target.value }))} />
                  </Form.Item>
                  <Form.Item name="twitter_image" label="Twitter Image URL">
                    <Input value={fieldsToSet?.twitter_image ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, twitter_image: e.target.value }))} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Advanced Section */}
            <Card
              title={<span style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>Advanced</span>}
              size="small"
              style={{
                marginBottom: 24,
                borderRadius: 12,
                border: 'none',
                background: '#fff',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
              }}
              headStyle={{ border: 'none', background: 'transparent', padding: '16px 24px 0 24px' }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Form.Item name="noindex" valuePropName="checked">
                    <Checkbox checked={!!fieldsToSet?.noindex} onChange={e => setFieldsToSet((f: any) => ({ ...f, noindex: e.target.checked }))}>Noindex</Checkbox>
                  </Form.Item>
                  <Form.Item name="nofollow" valuePropName="checked">
                    <Checkbox checked={!!fieldsToSet?.nofollow} onChange={e => setFieldsToSet((f: any) => ({ ...f, nofollow: e.target.checked }))}>Nofollow</Checkbox>
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item name="json_ld" label="JSON-LD (as JSON)">
                    <TextArea rows={4} value={fieldsToSet?.json_ld ?? ''} onChange={e => setFieldsToSet((f: any) => ({ ...f, json_ld: e.target.value }))} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
            <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                style={{
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)',
                  border: 'none',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  boxShadow: '0 2px 8px 0 rgba(37,99,235,0.08)',
                }}
                disabled={loading}
              >
                Save as Draft
              </Button>
              <Button
                type="default"
                size="large"
                style={{
                  background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 8,
                  border: 'none',
                  letterSpacing: 0.5,
                  boxShadow: '0 2px 8px 0 rgba(6,182,212,0.08)',
                }}
                disabled={loading}
                onClick={() => {
                  form
                    .validateFields()
                    .then((values) => onFinish(values, true));
                }}
              >
                Publish
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
  
// (Removed duplicate/erroneous JSX block at the end)
};

export default PostForm;
