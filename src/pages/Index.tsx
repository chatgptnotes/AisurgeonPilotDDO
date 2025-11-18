import { useNavigate } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';

const Index = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/patient-signup');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <LandingPage
      onGetStarted={handleGetStarted}
      onLoginClick={handleLoginClick}
    />
  );
};

export default Index;
