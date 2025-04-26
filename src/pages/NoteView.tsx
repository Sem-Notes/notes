import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';

const NoteView = () => {
  const { id } = useParams<{ id: string }>();

  // Redirect to the new PDF View page
  return <Navigate to={`/page-view/${id}`} replace />;
};

export default NoteView; 