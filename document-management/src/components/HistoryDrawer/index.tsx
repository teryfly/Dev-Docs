import React, { useState } from 'react';
import { Drawer, List, Button, Space, Modal, Typography, Tag } from 'antd';
import { useSelectionStore } from '@/stores/selectionStore';
import { useCompareStore } from '@/stores/compareStore';
import { useDeleteDocument, useUpdateDocument } from '@/hooks/useDocuments';
import { PlanDocumentResponse } from '@/types/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import styles from './styles.module.css';
import { useProjectDocuments, useSelectHistoryByFilename } from '@/hooks/useProjectDocuments';

const { Text } = Typography;

interface HistoryDrawerProps {
  open: boolean;
  filename: string;
  onClose: () => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ open, filename, onClose }) => {
  const navigate = useNavigate();
  const { projectId, categoryId } = useSelectionStore();
  const { leftDocId, rightDocId, setLeftDocId, setRightDocId, canCompare } = useCompareStore();
  const [previewDoc, setPreviewDoc] = useState<PlanDocumentResponse | null>(null);

  // Use unified project cache
  const { data: allDocs } = useProjectDocuments(projectId);
  const history = useSelectHistoryByFilename(allDocs, filename, categoryId);

  const deleteMutation = useDeleteDocument();
  const updateMutation = useUpdateDocument();

  const handleDelete = (doc: PlanDocumentResponse) => {
    Modal.confirm({
      title: '删除版本',
      content: `确认删除版本 v${doc.version}？该操作不可恢复。`,
      onOk: async () => {
        await deleteMutation.mutateAsync(doc.id);
      }
    });
  };

  const handleRevert = async (doc: PlanDocumentResponse) => {
    Modal.confirm({
      title: '回退版本',
      content: `确认基于版本 v${doc.version} 创建新版本？`,
      onOk: async () => {
        await updateMutation.mutateAsync({
          id: doc.id,
          data: { content: doc.content }
        });
      }
    });
  };

  const handleCompare = () => {
    if (canCompare() && projectId && categoryId) {
      navigate(`/app/projects/${projectId}/categories/${categoryId}/docs/${encodeURIComponent(filename)}/compare?left=${leftDocId}&right=${rightDocId}`);
    }
  };

  return (
    <>
      <Drawer
        title={`历史版本 - ${filename}`}
        placement="right"
        width={600}
        onClose={onClose}
        open={open}
      >
        <div className={styles.compareBar}>
          <Space>
            <Text>已选:</Text>
            {leftDocId && <Tag color="blue">左 v{history?.find(h => h.id === leftDocId)?.version}</Tag>}
            {rightDocId && <Tag color="green">右 v{history?.find(h => h.id === rightDocId)?.version}</Tag>}
          </Space>
          <Button type="primary" disabled={!canCompare()} onClick={handleCompare}>
            对比这两个版本
          </Button>
        </div>

        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button size="small" onClick={() => setLeftDocId(item.id)}>设为左</Button>,
                <Button size="small" onClick={() => setRightDocId(item.id)}>设为右</Button>,
                <Button size="small" onClick={() => setPreviewDoc(item)}>查看</Button>,
                <Button size="small" onClick={() => handleRevert(item)}>回退</Button>,
                <Button size="small" danger onClick={() => handleDelete(item)}>删除</Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>v{item.version}</Text>
                    {history?.[0] && item.id === history[0].id && <Tag color="success">当前</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{dayjs(item.created_time).format('YYYY-MM-DD HH:mm:ss')}</Text>
                    <Text type="secondary">来源: {item.source}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        title={`预览 v${previewDoc?.version}`}
        open={!!previewDoc}
        onCancel={() => setPreviewDoc(null)}
        footer={null}
        width={800}
      >
        <pre className={styles.preview}>{previewDoc?.content}</pre>
      </Modal>
    </>
  );
};

export default HistoryDrawer;