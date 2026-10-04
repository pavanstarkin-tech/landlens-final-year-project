import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentVerificationHub } from '../../components/shared/DocumentVerificationHub';

export const VerifyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <DocumentVerificationHub
      onBack={() => navigate(-1)}
    />
  );
};
