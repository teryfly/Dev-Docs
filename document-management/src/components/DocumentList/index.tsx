import React, { useState } from 'react';
import { Table, Button, Space, Select, Modal, Input } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDeleteAllHistory } from '@/hooks/useDocuments';
import { PlanDocumentResponse } from '@/types/api';
import dayjs from 'dayjs';
import styles from './styles.module.css';
import { useProjectDocuments, useSelectLatestByFilename } from '@/hooks/useProjectDocuments';

interface DocumentListProps {
  onOpenHistory: (filename: string) => void;
  onRename: (doc: PlanDocumentResponse) => void;
  onMove: (docs: PlanDocumentResponse[]) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ onOpenHistory, onRename, onMove }) => {
  const navigate = useNavigate();
  const {
    projectId,
    categoryId,
    searchQuery,
    sortBy,
    order,
    page,
    pageSize,
    setSortBy,
    setOrder,
    setPage,
    setPageSize
  } = useSelectionStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlanDocumentResponse | null>(null);
  const [confirmText, setConfirmText] = useState('');

  // Fetch full history once by project
  const { data: allDocs, isLoading } = useProjectDocuments(projectId);
  // Compute latest-by-filename with filters/sort/pagination
  const data = useSelectLatestByFilename(allDocs, {
    projectId,
    categoryId,
    searchQuery,
    sortBy,
    order,
    page,
    pageSize
  });

  const deleteAllMutation = useDeleteAllHistory();

  const handleDelete = (doc: PlanDocumentResponse) => {
    setDeleteTarget(doc);
    setConfirmText('');
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget && confirmText === deleteTarget.filename && projectId && categoryId) {
      await deleteAllMutation.mutateAsync({
        project_id: projectId,
        category_id: categoryId,
        filename: deleteTarget.filename
      });
      setDeleteModalVisible(false);
      setDeleteTarget(null);
    }
  };

  const handleBatchMove = () => {
    const docs = (data?.items || []).filter(item => selectedRowKeys.includes(item.id));
    if (docs.length > 0) {
      onMove(docs);
    }
  };

  const handleBatchDelete = async () => {
    const docs = (data?.items || []).filter(item => selectedRowKeys.includes(item.id));
    if (docs.length === 0) return;

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${docs.length} 个文档的全部历史吗？此操作不可恢复。`,
      onOk: async () => {
        if (!projectId || !categoryId) return;
        for (const doc of docs) {
          await deleteAllMutation.mutateAsync({
            project_id: projectId,
            category_id: categoryId,
            filename: doc.filename
          });
        }
        setSelectedRowKeys([]);
      }
    });
  };

  const columns: TableProps<PlanDocumentResponse>['columns'] = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (text, record) => (
        <a onClick={() => navigate(`/app/projects/${projectId}/categories/${categoryId}/docs/${encodeURIComponent(record.filename)}`)}>
          {text}
        </a>
      )
    },
    {
      title: '最新版本',
      dataIndex: 'version',
      key: 'version',
      render: (v) => `v${v}`
    },
    {
      title: '最新时间',
      dataIndex: 'created_time',
      key: 'created_time',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/app/projects/${projectId}/categories/${categoryId}/docs/${encodeURIComponent(record.filename)}`)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => onOpenHistory(record.filename)}>
            历史
          </Button>
          <Button type="link" size="small" onClick={() => onRename(record)}>
            重命名
          </Button>
          <Button type="link" size="small" onClick={() => onMove([record])}>
            移动
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  if (!projectId) {
    return (
      <div className={styles.emptyState}>
        <p>请选择项目</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <span>排序:</span>
          <Select
            style={{ width: 120 }}
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: '创建时间', value: 'created_time' },
              { label: '文件名', value: 'filename' },
              { label: '版本号', value: 'version' }
            ]}
          />
          <Select
            style={{ width: 80 }}
            value={order}
            onChange={setOrder}
            options={[
              { label: '降序', value: 'desc' },
              { label: '升序', value: 'asc' }
            ]}
          />
        </Space>
        <Space>
          <Button disabled={selectedRowKeys.length === 0} onClick={handleBatchMove}>
            批量移动
          </Button>
          <Button danger disabled={selectedRowKeys.length === 0} onClick={handleBatchDelete}>
            批量删除
          </Button>
        </Space>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys
        }}
        columns={columns}
        dataSource={data?.items}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.total,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title="删除全部历史"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteTarget(null);
        }}
        okButtonProps={{ disabled: confirmText !== deleteTarget?.filename }}
      >
        <p>输入文件名以确认删除所有历史版本，此操作不可恢复。</p>
        <p>文件名: <strong>{deleteTarget?.filename}</strong></p>
        <Input
          placeholder="请输入文件名确认"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default DocumentList;