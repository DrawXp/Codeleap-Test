import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, provider } from '../services/firebase';

const GoogleIcon = () => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="mr-3 h-5 w-5"
  >
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.64 24.55c0-1.65-.15-3.23-.42-4.75H24v9h12.79c-.55 2.87-2.13 5.31-4.57 6.95l7.26 5.19C43.73 35.03 46.64 30.29 46.64 24.55z" />
    <path fill="#FBBC05" d="M10.54 28.55c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59L2.56 13.22C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.23z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.26-5.19C30.28 39.09 27.42 40.5 24 40.5c-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

export function Signup() {
  const [inputData, setInputData] = useState('');
  const navigate = useNavigate();
  const { username, setUsername } = useUser();

  useEffect(() => {
    if (username) {
      navigate('/main');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const currentUsername = user.displayName || user.email?.split('@')[0] || 'Unknown User';
        setUsername(currentUsername);
        navigate('/main');
      }
    });

    return () => unsubscribe();
  }, [username, navigate, setUsername]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputData.trim()) {
      setUsername(inputData.trim());
      navigate('/main');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUsername = result.user.displayName || result.user.email?.split('@')[0] || 'Unknown User';
      setUsername(googleUsername);
      navigate('/main');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-panel p-8 w-full max-w-[31.25rem]">
        <h1 className="text-[1.375rem] font-bold mb-6 text-white tracking-wide text-center">Welcome!</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col mb-4">
          <label htmlFor="username" className="text-[1rem] mb-2 text-gray-300">
            Please enter your username
          </label>
          
          <input
            type="text"
            id="username"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="John doe"
            className="glass-input mb-6"
          />
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!inputData.trim()}
              className="btn-primary"
            >
              ENTER
            </button>
          </div>
        </form>

        <div className="relative flex py-6 items-center">
          <div className="flex-grow border-t border-white/20"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-white/20"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full bg-white text-gray-800 font-bold py-3 px-8 rounded-[8px] transition-colors duration-200 hover:bg-gray-200 shadow-md"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}