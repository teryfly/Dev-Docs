import React, { useState } from 'react';
import DocumentList from '@/components/DocumentList';
import HistoryDrawer from '@/components/HistoryDrawer';
import RenameModal from '@/components/RenameModal';
import MoveCategoryModal from '@/components/MoveCategoryModal';
import { PlanDocumentResponse } from '@/types/api';
import { useCompareStore } from '@/stores/compareStore';

const DocumentListPage: React.FC = () => {
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyFilename, setHistoryFilename] = useState('');
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDocument, setRenameDocument] = useState<PlanDocumentResponse | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveDocuments, setMoveDocuments] = useState<PlanDocumentResponse[]>([]);

  const { setCurrentFilename } = useCompareStore();

  const handleOpenHistory = (filename: string) => {
    setHistoryFilename(filename);
    setCurrentFilename(filename);
    setHistoryDrawerOpen(true);
  };

  const handleRename = (doc: PlanDocumentResponse) => {
    setRenameDocument(doc);
    setRenameModalOpen(true);
  };

  const handleMove = (docs: PlanDocumentResponse[]) => {
    setMoveDocuments(docs);
    setMoveModalOpen(true);
  };

  return (
    <>
      <DocumentList
        onOpenHistory={handleOpenHistory}
        onRename={handleRename}
        onMove={handleMove}
      />
      <HistoryDrawer
        open={historyDrawerOpen}
        filename={historyFilename}
        onClose={() => setHistoryDrawerOpen(false)}
      />
      <RenameModal
        open={renameModalOpen}
        document={renameDocument}
        onClose={() => {
          setRenameModalOpen(false);
          setRenameDocument(null);
        }}
      />
      <MoveCategoryModal
        open={moveModalOpen}
        documents={moveDocuments}
        onClose={() => {
          setMoveModalOpen(false);
          setMoveDocuments([]);
        }}
      />
    </>
  );
};

export default DocumentListPage;