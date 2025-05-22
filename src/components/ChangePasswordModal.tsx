import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onClose, onLogout }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword: values.currentPassword,
          password: values.password,
          passwordConfirmation: values.passwordConfirmation,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
        }
      );
      // If API returns error in response body (not as thrown error)
      if (res.data && res.data.error) {
        message.error(res.data.error.message || 'Failed to change password');
        setLoading(false);
        throw new Error(res.data.error.message || 'Failed to change password');
      }
      message.success('Password changed successfully. You will be logged out.');
      form.resetFields();
      onClose();
      if (onLogout) {
        setTimeout(() => {
          onLogout();
        }, 1200);
      }
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{
          background: '#2563eb',
          padding: '16px 0',
          color: '#fff',
          fontWeight: 700,
          fontSize: 20,
          textAlign: 'center',
          margin: '-24px -24px 24px -24px',
        }}>
          Change Password
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      styles={{
        body: {
          background: '#f8fafc',
          borderRadius: 8,
          padding: 32,
        }
      }}
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ width: '100%' }}
      >
        <Form.Item
          name="currentPassword"
          label={<span style={{ fontWeight: 500 }}>Current Password</span>}
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password autoFocus size="large" style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }} />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500 }}>New Password</span>}
          rules={[{ required: true, message: 'Please enter your new password' }]}
        >
          <Input.Password size="large" style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }} />
        </Form.Item>
        <Form.Item
          name="passwordConfirmation"
          label={<span style={{ fontWeight: 500 }}>Confirm New Password</span>}
          dependencies={["password"]}
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password size="large" style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }} />
        </Form.Item>
        <Form.Item style={{ marginTop: 32 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              borderRadius: 8,
              background: '#2563eb',
              border: 'none',
              fontWeight: 700,
              letterSpacing: 0.5,
              boxShadow: '0 2px 8px 0 rgba(37,99,235,0.08)',
              fontSize: 16,
              height: 48,
            }}
          >
            Change Password
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
