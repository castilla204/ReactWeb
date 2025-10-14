import { DisputePanel } from '../components/DisputePanel';
import { useNavigate } from 'react-router-dom';

export const DisputePanelPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/admin');
  };

  return <DisputePanel onBack={handleBack} />;
};














