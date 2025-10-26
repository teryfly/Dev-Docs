import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Space, Modal, message, Input, Tag } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, EditOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { useSelectionStore } from '@/stores/selectionStore';
import { useUpdateDocument, useDeleteAllHistory, useDocumentDetail } from '@/hooks/useDocuments';
import HistoryDrawer from '@/components/HistoryDrawer';
import RenameModal from '@/components/RenameModal';
import MoveCategoryModal from '@/components/MoveCategoryModal';
import MarkdownPreview from '@/components/MarkdownPreview';
import { PlanDocumentResponse } from '@/types/api';
import { useCompareStore } from '@/stores/compareStore';
import { useProjectDocuments, useSelectHistoryByFilename } from '@/hooks/useProjectDocuments';
import dayjs from 'dayjs';
import styles from './styles.module.css';

type ViewMode = 'preview' | 'edit';

const DocumentDetailPage: React.FC = () => {
  const { filename } = useParams<{ filename: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projectId, categoryId } = useSelectionStore();
  const { setCurrentFilename } = useCompareStore();

  const [content, setContent] = useState('');
  const [currentDoc, setCurrentDoc] = useState<PlanDocumentResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const decodedFilename = filename ? decodeURIComponent(filename) : '';

  // Check if viewing specific version via docId query param
  const docIdParam = searchParams.get('docId');
  const specificDocId = docIdParam ? Number(docIdParam) : undefined;

  const { data: allDocs } = useProjectDocuments(projectId);
  const history = useSelectHistoryByFilename(allDocs, decodedFilename, categoryId);

  // Fetch specific document if docId provided
  const { data: specificDoc } = useDocumentDetail(specificDocId);

  const updateMutation = useUpdateDocument();
  const deleteAllMutation = useDeleteAllHistory();

  useEffect(() => {
    // If viewing specific version, use that document
    if (specificDoc) {
      setCurrentDoc(specificDoc);
      setContent(specificDoc.content);
      setCurrentFilename(decodedFilename);
      // Force preview mode when viewing historical version
      setViewMode('preview');
    } else if (history && history.length > 0) {
      // Otherwise use latest version from history
      const latest = history[0];
      setCurrentDoc(latest);
      setContent(latest.content);
      setCurrentFilename(decodedFilename);
    }
  }, [history, decodedFilename, setCurrentFilename, specificDoc]);

  const handleSave = async () => {
    if (!currentDoc) return;
    await updateMutation.mutateAsync({
      id: currentDoc.id,
      data: { content }
    });
    setViewMode('preview');
    // After save, navigate back to latest version (remove docId param)
    if (projectId) {
      navigate(`/app/projects/${projectId}/docs/${encodeURIComponent(decodedFilename)}`);
    }
  };

  const handleExport = () => {
    let exportFilename = decodedFilename;
    if (!exportFilename.toLowerCase().endsWith('.md')) {
      exportFilename = `${exportFilename}.md`;
    }
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename;
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
        if (deleteConfirmText === decodedFilename && projectId) {
          if (categoryId) {
            await deleteAllMutation.mutateAsync({
              project_id: projectId,
              category_id: categoryId,
              filename: decodedFilename
            });
          }
          navigate(`/app/projects/${projectId}`);
        } else {
          message.error('文件名不匹配');
          return Promise.reject();
        }
      }
    });
  };

  const handleBack = () => {
    if (projectId) {
      navigate(`/app/projects/${projectId}`);
    } else {
      navigate('/app/projects');
    }
  };

  const toggleViewMode = () => {
    // Only allow toggling to edit mode if viewing latest version
    if (specificDocId) {
      message.warning('历史版本仅支持预览，如需编辑请先回退到此版本');
      return;
    }
    setViewMode(prev => prev === 'preview' ? 'edit' : 'preview');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (viewMode === 'edit' && !specificDocId) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, currentDoc, viewMode, specificDocId]);

  const isHistoricalVersion = !!specificDocId;
  const isLatestVersion = history && history.length > 0 && currentDoc?.id === history[0].id;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          <span className={styles.filename}>{decodedFilename}</span>
          <span className={styles.version}>
            v{currentDoc?.version}
            {isLatestVersion && <Tag color="success" style={{ marginLeft: 8 }}>当前</Tag>}
            {isHistoricalVersion && !isLatestVersion && <Tag color="warning" style={{ marginLeft: 8 }}>历史</Tag>}
          </span>
          {currentDoc && (
            <span className={styles.timestamp}>
              {dayjs(currentDoc.created_time).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          )}
        </Space>
        <Space>
          {viewMode === 'edit' && !specificDocId && (
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              保存为新版本
            </Button>
          )}
          {viewMode === 'preview' && (
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
            >
              导出.md
            </Button>
          )}
          <Button 
            icon={viewMode === 'preview' ? <EditOutlined /> : <EyeOutlined />}
            onClick={toggleViewMode}
            disabled={isHistoricalVersion && viewMode === 'preview'}
          >
            {viewMode === 'preview' ? '编辑' : '预览'}
          </Button>
          <Button onClick={() => setRenameModalOpen(true)} disabled={isHistoricalVersion}>
            重命名
          </Button>
          <Button onClick={() => setMoveModalOpen(true)} disabled={isHistoricalVersion}>
            移动
          </Button>
          <Button danger onClick={handleDeleteAll} disabled={isHistoricalVersion}>
            删除全部历史
          </Button>
          <Button onClick={() => setHistoryDrawerOpen(true)}>历史</Button>
        </Space>
      </div>

      {viewMode === 'preview' ? (
        <div className={styles.previewContainer}>
          <MarkdownPreview content={content} />
        </div>
      ) : (
        <div 
          ref={containerRef}
          className={styles.editContainer}
          style={{ cursor: isDragging ? 'col-resize' : 'default' }}
        >
          <div 
            className={styles.editorPane}
            style={{ width: `${leftWidth}%` }}
          >
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={content}
              onChange={(value) => setContent(value || '')}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'on',
                fontSize: 14
              }}
            />
          </div>
          
          <div 
            className={styles.resizer}
            onMouseDown={handleMouseDown}
          />
          
          <div 
            className={styles.previewPane}
            style={{ width: `${100 - leftWidth}%` }}
          >
            <MarkdownPreview content={content} />
          </div>
        </div>
      )}

      <HistoryDrawer
        open={historyDrawerOpen}
        filename={decodedFilename}
        currentDocId={currentDoc?.id}
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