import React, { useEffect, useState } from 'react';
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
  const { projectId } = useSelectionStore();
  const leftId = Number(searchParams.get('left'));
  const rightId = Number(searchParams.get('right'));
  const { data: leftDoc } = useDocumentDetail(leftId);
  const { data: rightDoc } = useDocumentDetail(rightId);
  const [swapped, setSwapped] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const decodedFilename = filename ? decodeURIComponent(filename) : '';
  const handleBack = () => {
    if (projectId) {
      navigate(`/app/projects/${projectId}/docs/${encodeURIComponent(decodedFilename)}`);
    } else {
      navigate('/app/projects');
    }
  };
  const handleSwap = () => {
    setSwapped(!swapped);
  };
  const original = swapped ? rightDoc?.content : leftDoc?.content;
  const modified = swapped ? leftDoc?.content : rightDoc?.content;
  // Set window title: 对比-[文件名]-[左版本号]-[右版本号]
  useEffect(() => {
    const leftVersion = swapped ? rightDoc?.version : leftDoc?.version;
    const rightVersion = swapped ? leftDoc?.version : rightDoc?.version;
    // When data not ready, show a loading style title with what we know
    const leftPart = leftVersion !== undefined ? `v${leftVersion}` : '加载中';
    const rightPart = rightVersion !== undefined ? `v${rightVersion}` : '加载中';
    const base = decodedFilename ? decodedFilename : '未命名';
    document.title = `对比-${base}-${leftPart}-${rightPart}`;
    return () => {
      // Optional: do not override title on other pages; leaving as-is
    };
  }, [decodedFilename, leftDoc?.version, rightDoc?.version, swapped]);
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