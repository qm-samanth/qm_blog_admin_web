import React, { useEffect, useState } from 'react';
import { Card, Spin, message, Avatar, Row, Col, Input, Button, Form } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';
interface FormValues {
  name: string;
  bio: string;
  profile_pic_url?: string;
  social_links?: string | null;
}

interface AuthorProfile {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  profile_pic_url?: string | null;
  social_links?: string | null;
}

const EditProfile: React.FC = () => {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [form] = Form.useForm();


  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Get author documentId for current user
        const authorRes = await axios.get(`${API_BASE_URL}/authors?populate=user`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const authors = authorRes.data.data || [];
        const currentAuthor = authors.find((a: any) => a.user && (a.user.username === username || a.user.email === username));
        const authorDocumentId = currentAuthor ? currentAuthor.documentId : null;
        if (!authorDocumentId) {
          setProfile(null);
          setLoading(false);
          return;
        }
        // Fetch profile by documentId
        const res = await axios.get(`${API_BASE_URL}/authors?filters[documentId][$eq]=${authorDocumentId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const data = res.data.data || res.data.body?.data || [];
        setProfile(data[0] || null);
      } catch (e) {
        message.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [token, username]);

  return (
    <div style={{ padding: 32, maxWidth: '100%' }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Edit Profile</h2>
      <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px #e0e0e0', width: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : profile ? (
          <Row gutter={24}>
            <Form 
              form={form}
              layout="vertical"
              initialValues={{
                name: profile.name,
                bio: profile.bio,
                profile_pic_url: profile.profile_pic_url
              }}
              onFinish={async (values: FormValues) => {
                setSaving(true);
                try {
                  await axios.put(`${API_BASE_URL}/authors/${profile.documentId}`, {
                    data: {
                      name: values.name,
                      bio: values.bio,
                      profile_pic_url: values.profile_pic_url,
                      social_links: values.social_links
                    }
                  }, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  message.success('Profile updated successfully', 3);
                  // Update the local profile object
                  setProfile({
                    ...profile,
                    name: values.name,
                    bio: values.bio,
                    profile_pic_url: values.profile_pic_url,
                    social_links: values.social_links
                  });
                } catch (e) {
                  message.error('Failed to update profile');
                } finally {
                  setSaving(false);
                }
              }}
              style={{ width: '100%' }}
            >
              <Row gutter={36}>
                <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 32 }}>
                    <div style={{
                      width: 250,
                      height: 250,
                      margin: '0 auto 24px auto',
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: '4px solid #f0f0f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                      background: '#0066e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {profile.profile_pic_url ? (
                        <img
                          src={profile.profile_pic_url}
                          alt="Profile"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
                        />
                      ) : (
                        <UserOutlined style={{ fontSize: 100, color: '#fff' }} />
                      )}
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{profile.name}</h3>
                    
                  </div>
                  
                  <Form.Item name="profile_pic_url" label="Profile Picture URL" style={{ textAlign: 'left' }}>
                    <Input placeholder="Enter image URL" />
                  </Form.Item>
                  
                  <div style={{ textAlign: 'left', padding: '12px', background: '#f9f9f9', borderRadius: 4, marginBottom: 16 }}>
                    <div style={{ fontWeight: 500, color: '#555', marginBottom: 8 }}>Account Info</div>
                    <Row gutter={12}>
                      <Col span={12}>
                        <div style={{ color: '#666', fontSize: 13, fontWeight: 500 }}>Created</div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {new Date(profile.createdAt).toLocaleString('en-IN', { 
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric', 
                            month: 'short', 
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ color: '#666', fontSize: 13, fontWeight: 500 }}>Last Updated</div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {new Date(profile.updatedAt).toLocaleString('en-IN', { 
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric', 
                            month: 'short', 
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                
                <Col xs={24} md={16}>
                  <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter your name' }]}>
                    <Input placeholder="Your name" size="large" />
                  </Form.Item>
                  
                  <Form.Item name="bio" label="Bio" style={{ height: 'auto' }}>
                    <Input.TextArea placeholder="Tell us about yourself..." rows={4} />
                  </Form.Item>
                  <Form.Item name="social_links" label="Social Links (JSON)" style={{ height: 'auto' }}>
                    <Input.TextArea
                      placeholder='{"twitter": "https://twitter.com/yourhandle", "linkedin": "https://linkedin.com/in/yourprofile"}'
                      rows={4}
                    />
                  </Form.Item>
                  
                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={saving} 
                      size="large" 
                      style={{ 
                        minWidth: 120, 
                        height: 44,
                        fontWeight: 600,
                        fontSize: 16
                      }}
                    >
                      Save Changes
                    </Button>
                    
                    <Button 
                      style={{ marginLeft: 16 }} 
                      size="large"
                      onClick={() => form.resetFields()}
                    >
                      Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Row>
        ) : (
          <div>No profile found.</div>
        )}
      </Card>
    </div>
  );
};

export default EditProfile;