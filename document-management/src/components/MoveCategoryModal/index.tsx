import React, { useState } from 'react';
import { Modal, Form, Select, Radio, Typography } from 'antd';
import { useCategories } from '@/hooks/useCategories';
import { useSelectionStore } from '@/stores/selectionStore';
import { useMigrateAllHistory, useMigrateFromCurrent, useDeleteAllHistory } from '@/hooks/useDocuments';
import { PlanDocumentResponse } from '@/types/api';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface MoveCategoryModalProps {
  open: boolean;
  documents: PlanDocumentResponse[];
  onClose: () => void;
}

const MoveCategoryModal: React.FC<MoveCategoryModalProps> = ({ open, documents, onClose }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { data: categories } = useCategories();
  const { projectId, categoryId } = useSelectionStore();
  const [mode, setMode] = useState<'all-history' | 'from-current'>('all-history');

  const migrateAllMutation = useMigrateAllHistory();
  const migrateCurrentMutation = useMigrateFromCurrent();
  const deleteAllMutation = useDeleteAllHistory();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!projectId || !categoryId) return;

      const targetCategoryId = values.target_category_id;

      for (const doc of documents) {
        if (mode === 'all-history') {
          await migrateAllMutation.mutateAsync({
            project_id: projectId,
            source_category_id: categoryId,
            target_category_id: targetCategoryId,
            filename: doc.filename
          });
          await deleteAllMutation.mutateAsync({
            project_id: projectId,
            category_id: categoryId,
            filename: doc.filename
          });
        } else {
          await migrateCurrentMutation.mutateAsync({
            document_id: doc.id,
            target_category_id: targetCategoryId
          });
          await deleteAllMutation.mutateAsync({
            project_id: projectId,
            category_id: categoryId,
            filename: doc.filename
          });
        }
      }

      form.resetFields();
      onClose();

      if (documents.length === 1) {
        navigate(`/app/projects/${projectId}/categories/${targetCategoryId}/docs/${encodeURIComponent(documents[0].filename)}`);
      } else {
        navigate(`/app/projects/${projectId}/categories/${targetCategoryId}`);
      }
    } catch (error) {
      console.error('Move failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setMode('all-history');
    onClose();
  };

  const filteredCategories = categories?.filter(c => c.id !== categoryId);

  return (
    <Modal
      title="移动分类"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认移动"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="target_category_id"
          label="目标分类"
          rules={[{ required: true, message: '请选择目标分类' }]}
        >
          <Select
            placeholder="选择目标分类"
            options={filteredCategories?.map(c => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>
        <Form.Item label="移动范围">
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio value="all-history">全部历史</Radio>
            <Radio value="from-current">从当前版本起</Radio>
          </Radio.Group>
        </Form.Item>
        <Text type="warning">
          提示：此操作会复制到目标分类并删除源分类的全部历史。不可恢复。
        </Text>
      </Form>
    </Modal>
  );
};

export default MoveCategoryModal;