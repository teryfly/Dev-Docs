import React, { useState } from 'react';
import { Table, Button, Space, Select, Modal, message } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelectionStore } from '@/stores/selectionStore';
import { useDeleteAllHistory } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';
import { PlanDocumentResponse } from '@/types/api';
import dayjs from 'dayjs';
import styles from './styles.module.css';
import { useProjectDocuments, useSelectLatestByFilename } from '@/hooks/useProjectDocuments';
import apiClient from '@/api/client';

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

  const { data: projects } = useProjects();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: allDocs, isLoading } = useProjectDocuments(projectId);
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
    if (!projectId) return;
    
    Modal.confirm({
      title: '删除全部历史',
      content: `确定要删除文件 "${doc.filename}" 的全部历史版本吗？此操作不可恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteAllMutation.mutateAsync({
          project_id: projectId,
          category_id: doc.category_id,
          filename: doc.filename
        });
      }
    });
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
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!projectId) return;
        for (const doc of docs) {
          await deleteAllMutation.mutateAsync({
            project_id: projectId,
            category_id: doc.category_id,
            filename: doc.filename
          });
        }
        setSelectedRowKeys([]);
      }
    });
  };

  const handleMergeExport = async () => {
    const docs = (data?.items || []).filter(item => selectedRowKeys.includes(item.id));
    if (docs.length === 0) {
      message.warning('请先选择要合并的文档');
      return;
    }
    try {
      const ids = docs.map(d => d.id);
      const response = await apiClient.post('/v1/plan/documents/merge', {
        document_ids: ids
      });
      const { count, merged } = response.data;

      const projectName = projects?.find(p => p.id === projectId)?.name || '项目';
      const fileName = `${projectName}-文档${count}个.txt`;
      const blob = new Blob([merged], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      message.success(`合并导出成功，共 ${count} 个文档`);
    } catch (error: any) {
      message.error(`合并导出失败: ${error.message}`);
    }
  };

  const goDetail = (record: PlanDocumentResponse) => {
    if (!projectId) return;
    navigate(`/app/projects/${projectId}/docs/${encodeURIComponent(record.filename)}`);
  };

  const columns: TableProps<PlanDocumentResponse>['columns'] = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (text, record) => (
        <a onClick={() => goDetail(record)}>
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
          <Button type="link" size="small" onClick={() => goDetail(record)}>
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

  const selectedCount = selectedRowKeys.length;

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
          <span>已选择 {selectedCount} 项</span>
        </Space>
        <Space>
          <Button disabled={selectedRowKeys.length === 0} onClick={handleBatchMove}>
            批量移动
          </Button>
          <Button danger disabled={selectedRowKeys.length === 0} onClick={handleBatchDelete}>
            批量删除
          </Button>
          <Button type="dashed" disabled={selectedRowKeys.length === 0} onClick={handleMergeExport}>
            合并导出
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
    </div>
  );
};

export default DocumentList;