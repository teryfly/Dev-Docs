import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, Input, Modal, Select, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { useSelectionStore } from '@/stores/selectionStore';
import { useCreateDocument } from '@/hooks/useDocuments';
import MarkdownPreview from '@/components/MarkdownPreview';
import styles from './styles.module.css';

const { Text } = Typography;

type ViewMode = 'edit';

const CreateDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ pid?: string; cid?: string }>();
  const [form] = Form.useForm();
  const { projectId, categoryId, setProjectId, setCategoryId } = useSelectionStore();

  const resolvedProjectId = useMemo(() => {
    const fromParam = params.pid ? Number(params.pid) : undefined;
    return projectId ?? fromParam;
  }, [params.pid, projectId]);

  const resolvedCategoryId = useMemo(() => {
    const fromParam = params.cid ? Number(params.cid) : undefined;
    return categoryId ?? fromParam;
  }, [params.cid, categoryId]);

  useEffect(() => {
    // Sync selection store when entering via route
    if (params.pid) {
      const pidNum = Number(params.pid);
      if (!Number.isNaN(pidNum)) setProjectId(pidNum);
    }
    if (params.cid) {
      const cidNum = Number(params.cid);
      if (!Number.isNaN(cidNum)) setCategoryId(cidNum);
    }
  }, [params.pid, params.cid, setProjectId, setCategoryId]);

  const [content, setContent] = useState<string>('');
  const [viewMode] = useState<ViewMode>('edit');
  const [leftWidth, setLeftWidth] = useState<number>(40); // percent, default 2:3 => 40% : 60%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const createMutation = useCreateDocument();

  const canSave = !!resolvedProjectId && !!resolvedCategoryId;

  const handleSave = async () => {
    try {
      if (!canSave) {
        message.error('请先选择项目与分类');
        return;
      }
      const values = await form.validateFields();
      const result = await createMutation.mutateAsync({
        project_id: resolvedProjectId!,
        category_id: resolvedCategoryId!,
        filename: values.filename,
        content: content,
        source: values.source || 'user'
      });
      navigate(`/app/projects/${result.project_id}/docs/${encodeURIComponent(result.filename)}`);
    } catch (err) {
      // validation errors are handled by antd; mutation errors by hook
    }
  };

  const handleBack = () => {
    if (resolvedProjectId) {
      if (resolvedCategoryId) {
        navigate(`/app/projects/${resolvedProjectId}/categories/${resolvedCategoryId}`);
      } else {
        navigate(`/app/projects/${resolvedProjectId}`);
      }
    } else {
      navigate('/app/projects');
    }
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
      // Limit between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Confirm leaving if unsaved content
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (content || form.getFieldValue('filename')) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [content, form]);

  const onCancelCreate = () => {
    if (!content && !form.getFieldValue('filename')) {
      handleBack();
      return;
    }
    Modal.confirm({
      title: '放弃新建？',
      content: '当前内容尚未保存，确定要离开吗？',
      onOk: handleBack
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space size="middle">
          <Button icon={<ArrowLeftOutlined />} onClick={onCancelCreate}>
            返回
          </Button>
          <Text strong>新建文档</Text>
          <Form form={form} layout="inline" className={styles.inlineForm}>
            <Form.Item
              name="filename"
              rules={[
                { required: true, message: '请输入文件名' },
                { pattern: /\S/, message: '文件名不能仅包含空白字符' }
              ]}
            >
              <Input placeholder="例如: 开发计划.md" style={{ width: 280 }} />
            </Form.Item>
            <Form.Item name="source" initialValue="user">
              <Select style={{ width: 140 }}>
                <Select.Option value="user">user</Select.Option>
                <Select.Option value="server">server</Select.Option>
                <Select.Option value="chat">chat</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Space>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!canSave}
          >
            保存创建
          </Button>
        </Space>
      </div>

      <div
        ref={containerRef}
        className={styles.editContainer}
        style={{ cursor: isDragging ? 'col-resize' : 'default' }}
      >
        <div className={styles.editorPane} style={{ width: `${leftWidth}%` }}>
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

        <div className={styles.resizer} onMouseDown={handleMouseDown} />

        <div className={styles.previewPane} style={{ width: `${100 - leftWidth}%` }}>
          <MarkdownPreview content={content} />
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentPage;