import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { List, Button, Input, Upload, Typography, Spin, Space, Divider, message } from 'antd';
import { FolderOutlined, ArrowLeftOutlined, PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';



interface MediaList {
  folders: string[];
  files: string[];
}

const API_BASE = '/api/r2';

const MediaManager: React.FC = () => {
  const [prefix, setPrefix] = useState('');
  const [media, setMedia] = useState<MediaList>({ folders: [], files: [] });
  const [loading, setLoading] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [deleteFileConfirm, setDeleteFileConfirm] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/list`, { params: { prefix } });
      setMedia(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line
  }, [prefix]);

  const handleCreateFolder = async () => {
    if (!folderName) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/folder`, { folder: prefix + folderName + '/' });
      setFolderName('');
      fetchMedia();
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', prefix);
      await axios.post(`${API_BASE}/upload`, formData);
      setFile(null);
      fetchMedia();
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm(`Delete ${key}?`)) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE}/object`, { data: { key } });
      fetchMedia();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      background: '#fafcff',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      minHeight: 750,
      overflow: 'hidden',
    }}>
      {/* Folders Sidebar */}
      <div style={{
        width: 260,
        borderRight: '1px solid #eee',
        padding: 24,
        background: '#f5f7fa',
        minHeight: 400,
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <Typography.Title level={5} style={{ margin: 0, flex: 1 }}>Folders</Typography.Title>
          {prefix && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setPrefix(prefix.replace(/[^/]+\/$/, ''))}
              style={{ marginLeft: 4 }}
              title="Up"
            />
          )}
        </div>
        <List
          dataSource={media.folders}
          locale={{ emptyText: 'No folders' }}
          renderItem={folder => (
            <List.Item
              style={{ cursor: 'pointer', padding: '6px 0', background: folder === prefix ? '#e6f4ff' : undefined, borderRadius: 6 }}
              onClick={() => setPrefix(folder)}
            >
              <FolderOutlined style={{ color: '#2563eb', marginRight: 8 }} />
              {folder.replace(prefix, '')}
            </List.Item>
          )}
        />
        <Divider />
        <Input
          placeholder="New folder name"
          value={folderName}
          onChange={e => setFolderName(e.target.value)}
          style={{ marginBottom: 8 }}
          onPressEnter={handleCreateFolder}
          disabled={loading}
        />
        <Button icon={<PlusOutlined />} onClick={handleCreateFolder} disabled={loading || !folderName} type="primary" block>
          Create Folder
        </Button>
        {prefix && (
          <Button style={{ marginTop: 12 }} icon={<ArrowLeftOutlined />} onClick={() => setPrefix(prefix.replace(/[^/]+\/$/, ''))} block>
            Up
          </Button>
        )}
      </div>
      {/* Files Panel */}
      <div style={{ flex: 1, padding: 32, minHeight: 400, maxHeight: 700, overflowY: 'auto' }}>
        <Typography.Title level={5} style={{ marginBottom: 16 }}>Files in {prefix || '/'}</Typography.Title>
        <Space style={{ marginBottom: 16 }}>
          <Upload
            beforeUpload={file => {
              setFile(file);
              return false;
            }}
            showUploadList={!!file}
            maxCount={1}
            disabled={loading}
          >
            <Button icon={<UploadOutlined />} disabled={loading}>Select File</Button>
          </Upload>
          <Button type="primary" icon={<UploadOutlined />} onClick={handleUpload} disabled={loading || !file}>
            Upload
          </Button>
        </Space>
        {error && <Typography.Text type="danger">{error}</Typography.Text>}
        {loading ? (
          <div style={{ textAlign: 'center', margin: '32px 0' }}><Spin size="large" /></div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {media.files.length === 0 && <Typography.Text type="secondary">No files</Typography.Text>}
            {media.files.map(fileItem => {
              const publicUrl = `https://pub-8fc6e115d4624e84b086c564757fba02.r2.dev/${fileItem}`;
              return (
                <div key={fileItem} style={{ width: 250, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #eee', padding: 16 }}>
                  <img
                    src={publicUrl}
                    alt={fileItem.replace(prefix, '')}
                    style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', marginBottom: 12 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ fontSize: 13, wordBreak: 'break-all', textAlign: 'center', marginBottom: 8 }}>{fileItem.replace(prefix, '')}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <Button
                      icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15V5a2 2 0 0 1 2-2h10"></path>
                        </svg>
                      }
                      size="small"
                      style={{ borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', boxShadow: '0 2px 8px 0 rgba(37,99,235,0.08)' }}
                      onClick={() => {
                        navigator.clipboard.writeText(publicUrl);
                        message.success('Copied!');
                      }}
                      title="Copy URL"
                    />
                    <Button
                      icon={<DeleteOutlined style={{ color: '#fff' }} />}
                      danger
                      size="small"
                      style={{ borderRadius: 6, background: '#d32f2f', color: '#fff', border: 'none', boxShadow: '0 2px 8px 0 rgba(211,47,47,0.08)' }}
                      onClick={() => setDeleteFileConfirm(fileItem)}
                      title="Delete"
                    />
                  </div>
      {/* Custom Delete Confirmation Modal */}
      {deleteFileConfirm && (
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
            minWidth: 340,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#222', marginBottom: 18 }}>
              Are you sure you want to delete this file?
            </div>
            <div style={{ color: '#d46b08', fontWeight: 500, marginBottom: 18 }}>
              {deleteFileConfirm.replace(prefix, '')}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 8 }}>
              <button
                style={{
                  background: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 16,
                  padding: '2.5px 20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px 0 rgba(211,47,47,0.08)'
                }}
                onClick={() => {
                  handleDelete(deleteFileConfirm);
                  setDeleteFileConfirm(null);
                }}
              >
                Yes, Delete
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
                onClick={() => setDeleteFileConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
                    
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaManager;
