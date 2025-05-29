
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { getCurrentUser } from '../store/slices/authSlice';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const Index = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useTypedSelector(state => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      dispatch(getCurrentUser());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return null;
};

export default Index;
