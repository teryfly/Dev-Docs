import React from 'react';
import { Modal, Form, Input, Typography } from 'antd';
import { useUpdateDocument } from '@/hooks/useDocuments';
import { PlanDocumentResponse } from '@/types/api';
import { useNavigate } from 'react-router-dom';
import { useSelectionStore } from '@/stores/selectionStore';

const { Text } = Typography;

interface RenameModalProps {
  open: boolean;
  document: PlanDocumentResponse | null;
  onClose: () => void;
}

const RenameModal: React.FC<RenameModalProps> = ({ open, document, onClose }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { projectId } = useSelectionStore();
  const updateMutation = useUpdateDocument();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!document || !projectId) return;

      const result = await updateMutation.mutateAsync({
        id: document.id,
        data: { filename: values.filename }
      });

      form.resetFields();
      onClose();
      navigate(`/app/projects/${projectId}/docs/${encodeURIComponent(result.filename)}`);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="重命名"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认重命名"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="filename"
          label="新文件名"
          initialValue={document?.filename}
          rules={[
            { required: true, message: '请输入文件名' },
            { pattern: /\S/, message: '文件名不能仅包含空白字符' }
          ]}
        >
          <Input placeholder="例如: 开发计划-2025.md" />
        </Form.Item>
        <Text type="secondary">
          说明：从该版本起以新文件名继续，旧文件名历史保留。
        </Text>
      </Form>
    </Modal>
  );
};

export default RenameModal;