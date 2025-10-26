import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import styles from './AppLayout.module.css';

const AppLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <TopBar />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;