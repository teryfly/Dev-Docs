import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import CreateDocumentModal from '@/components/CreateDocumentModal';
import styles from './AppLayout.module.css';

const AppLayout: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <TopBar onNewDocument={() => setCreateModalOpen(true)} />
      <div className={styles.content}>
        <Outlet />
      </div>
      <CreateDocumentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;