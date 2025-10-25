import React, { useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { Editor } from '@monaco-editor/react';
import { useSelectionStore } from '@/stores/selectionStore';
import { useCreateDocument } from '@/hooks/useDocuments';
import { useNavigate } from 'react-router-dom';

interface CreateDocumentModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { projectId, categoryId } = useSelectionStore();
  const [content, setContent] = useState('');
  const createMutation = useCreateDocument();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!projectId || !categoryId) return;

      const result = await createMutation.mutateAsync({
        project_id: projectId,
        category_id: categoryId,
        filename: values.filename,
        content: content,
        source: values.source || 'user'
      });

      form.resetFields();
      setContent('');
      onClose();
      navigate(`/app/projects/${projectId}/docs/${encodeURIComponent(result.filename)}`);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setContent('');
    onClose();
  };

  return (
    <Modal
      title="新建文档"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={900}
      okText="创建"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="filename"
          label="文件名"
          rules={[
            { required: true, message: '请输入文件名' },
            { pattern: /\S/, message: '文件名不能仅包含空白字符' }
          ]}
        >
          <Input placeholder="例如: 开发计划.md" />
        </Form.Item>
        <Form.Item name="source" label="来源" initialValue="user">
          <Select>
            <Select.Option value="user">user</Select.Option>
            <Select.Option value="server">server</Select.Option>
            <Select.Option value="chat">chat</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="内容">
          <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px' }}>
            <Editor
              height="300px"
              defaultLanguage="markdown"
              value={content}
              onChange={(value) => setContent(value || '')}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'on'
              }}
            />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateDocumentModal;