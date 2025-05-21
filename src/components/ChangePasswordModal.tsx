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
      title="Change Password"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password autoFocus />
        </Form.Item>
        <Form.Item
          name="password"
          label="New Password"
          rules={[{ required: true, message: 'Please enter your new password' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="passwordConfirmation"
          label="Confirm New Password"
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
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Change Password
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
