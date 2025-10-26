import React from 'react';
import { Select, Input, Button, Space } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useProjects } from '@/hooks/useProjects';
import { useCategories } from '@/hooks/useCategories';
import { useSelectionStore } from '@/stores/selectionStore';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const { data: categories } = useCategories();
  const {
    projectId,
    categoryId,
    searchQuery,
    setProjectId,
    setCategoryId,
    setSearchQuery
  } = useSelectionStore();

  const handleSearch = () => {
    setSearchQuery(searchQuery);
  };

  const canCreateDocument = projectId && categoryId;

  const goCreate = () => {
    if (!projectId) return;
    if (categoryId) {
      navigate(`/app/projects/${projectId}/categories/${categoryId}/create`);
    } else {
      navigate(`/app/projects/${projectId}/create`);
    }
  };

  return (
    <div className={styles.topBar}>
      <Space size="middle" style={{ width: '100%' }}>
        <Select
          placeholder="选择项目"
          style={{ width: 200 }}
          value={projectId}
          onChange={setProjectId}
          options={projects?.map(p => ({ label: p.name, value: p.id }))}
          allowClear
        />
        <Select
          placeholder="选择分类"
          style={{ width: 200 }}
          value={categoryId}
          onChange={setCategoryId}
          options={categories?.map(c => ({ label: c.name, value: c.id }))}
          disabled={!projectId}
          allowClear
        />
        <Input
          placeholder="搜索文件名"
          style={{ width: 300 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
          disabled={!projectId}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={goCreate}
          disabled={!canCreateDocument}
        >
          新建文档
        </Button>
      </Space>
    </div>
  );
};

export default TopBar;