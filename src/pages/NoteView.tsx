import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";

const NoteView = () => {
  const { id } = useParams<{ id: string }>();

  // Redirect to the new PDF View page
  return (
    <>
      <Helmet>
        <title>View Note | SemNotes</title>
        <meta name="description" content="Read and interact with academic notes on SemNotes." />
      </Helmet>
      <Navigate to={`/page-view/${id}`} replace />
    </>
  );
};

export default NoteView; 