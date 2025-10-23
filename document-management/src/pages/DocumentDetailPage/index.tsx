import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space, Modal, message, Input } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDocumentsHistory, useUpdateDocument, useDeleteAllHistory } from '@/hooks/useDocuments';
import HistoryDrawer from '@/components/HistoryDrawer';
import RenameModal from '@/components/RenameModal';
import MoveCategoryModal from '@/components/MoveCategoryModal';
import { PlanDocumentResponse } from '@/types/api';
import { useCompareStore } from '@/stores/compareStore';
import styles from './styles.module.css';

const DocumentDetailPage: React.FC = () => {
  const { filename } = useParams<{ filename: string }>();
  const navigate = useNavigate();
  const { projectId, categoryId } = useSelectionStore();
  const { setCurrentFilename } = useCompareStore();

  const [content, setContent] = useState('');
  const [currentDoc, setCurrentDoc] = useState<PlanDocumentResponse | null>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const decodedFilename = filename ? decodeURIComponent(filename) : '';

  const { data: history, refetch } = useDocumentsHistory({
    project_id: projectId,
    category_id: categoryId,
    filename: decodedFilename
  });

  const updateMutation = useUpdateDocument();
  const deleteAllMutation = useDeleteAllHistory();

  useEffect(() => {
    if (history && history.length > 0) {
      const latest = history[0];
      setCurrentDoc(latest);
      setContent(latest.content);
      setCurrentFilename(decodedFilename);
    }
  }, [history, decodedFilename, setCurrentFilename]);

  const handleSave = async () => {
    if (!currentDoc) return;
    await updateMutation.mutateAsync({
      id: currentDoc.id,
      data: { content }
    });
    refetch();
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = decodedFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = () => {
    setDeleteConfirmText('');
    Modal.confirm({
      title: '删除全部历史',
      content: (
        <div>
          <p>输入文件名以确认删除所有历史版本，此操作不可恢复。</p>
          <p>文件名: <strong>{decodedFilename}</strong></p>
          <Input
            placeholder="请输入文件名确认"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            style={{ marginTop: '8px' }}
          />
        </div>
      ),
      onOk: async () => {
        if (deleteConfirmText === decodedFilename && projectId && categoryId) {
          await deleteAllMutation.mutateAsync({
            project_id: projectId,
            category_id: categoryId,
            filename: decodedFilename
          });
          navigate(`/app/projects/${projectId}/categories/${categoryId}`);
        } else {
          message.error('文件名不匹配');
          return Promise.reject();
        }
      }
    });
  };

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/categories/${categoryId}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, currentDoc]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          <span className={styles.filename}>{decodedFilename}</span>
          <span className={styles.version}>当前: v{currentDoc?.version}</span>
        </Space>
        <Space>
          <Button onClick={() => setRenameModalOpen(true)}>重命名</Button>
          <Button onClick={() => setMoveModalOpen(true)}>移动</Button>
          <Button danger onClick={handleDeleteAll}>删除全部历史</Button>
          <Button onClick={() => setHistoryDrawerOpen(true)}>历史</Button>
        </Space>
      </div>

      <div className={styles.editorContainer}>
        <Editor
          height="calc(100vh - 200px)"
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

      <div className={styles.actions}>
        <Space>
          <Button type="primary" onClick={handleSave}>
            保存为新版本
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出.md
          </Button>
        </Space>
      </div>

      <HistoryDrawer
        open={historyDrawerOpen}
        filename={decodedFilename}
        onClose={() => setHistoryDrawerOpen(false)}
      />

      <RenameModal
        open={renameModalOpen}
        document={currentDoc}
        onClose={() => setRenameModalOpen(false)}
      />

      <MoveCategoryModal
        open={moveModalOpen}
        documents={currentDoc ? [currentDoc] : []}
        onClose={() => setMoveModalOpen(false)}
      />
    </div>
  );
};

export default DocumentDetailPage;