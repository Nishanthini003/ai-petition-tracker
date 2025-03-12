import { useEffect } from 'react';
import { AuthForm } from '../../components/auth/AuthForm';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signup, clearError } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store';

export const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only redirect if both user and token exist
    if (user && token) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, token]); // Only depend on user and token

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSignup = async (data: { mobile: string; password: string }) => {
    dispatch(signup(data));
  };

  // If user is already logged in, show loading state
  if (user && token) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <AuthForm isLogin={false} onSubmit={handleSignup} disabled={loading} />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
