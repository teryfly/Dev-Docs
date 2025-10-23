import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Space, Switch, Typography } from 'antd';
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons';
import { DiffEditor } from '@monaco-editor/react';
import { useDocumentDetail } from '@/hooks/useDocuments';
import { useSelectionStore } from '@/stores/selectionStore';
import styles from './styles.module.css';

const { Text } = Typography;

const ComparePage: React.FC = () => {
  const { filename } = useParams<{ filename: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projectId, categoryId } = useSelectionStore();

  const leftId = Number(searchParams.get('left'));
  const rightId = Number(searchParams.get('right'));

  const { data: leftDoc } = useDocumentDetail(leftId);
  const { data: rightDoc } = useDocumentDetail(rightId);

  const [swapped, setSwapped] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  const decodedFilename = filename ? decodeURIComponent(filename) : '';

  const handleBack = () => {
    navigate(`/app/projects/${projectId}/categories/${categoryId}/docs/${encodeURIComponent(decodedFilename)}`);
  };

  const handleSwap = () => {
    setSwapped(!swapped);
  };

  const original = swapped ? rightDoc?.content : leftDoc?.content;
  const modified = swapped ? leftDoc?.content : rightDoc?.content;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回历史
          </Button>
          <Text strong>对比: {decodedFilename}</Text>
          <Text type="secondary">
            左: v{swapped ? rightDoc?.version : leftDoc?.version} ({swapped ? rightDoc?.created_time?.substring(0, 16) : leftDoc?.created_time?.substring(0, 16)})
          </Text>
          <Text type="secondary">
            右: v{swapped ? leftDoc?.version : rightDoc?.version} ({swapped ? leftDoc?.created_time?.substring(0, 16) : rightDoc?.created_time?.substring(0, 16)})
          </Text>
        </Space>
        <Space>
          <Button icon={<SwapOutlined />} onClick={handleSwap}>
            交换左右
          </Button>
          <span>忽略空白:</span>
          <Switch checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
          <span>自动换行:</span>
          <Switch checked={wordWrap} onChange={setWordWrap} />
        </Space>
      </div>

      <div className={styles.diffContainer}>
        <DiffEditor
          height="calc(100vh - 120px)"
          language="markdown"
          original={original || ''}
          modified={modified || ''}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            ignoreTrimWhitespace: ignoreWhitespace,
            wordWrap: wordWrap ? 'on' : 'off',
            renderSideBySide: true
          }}
        />
      </div>
    </div>
  );
};

export default ComparePage;