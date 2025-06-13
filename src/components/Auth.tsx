import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';

interface AuthProps {
  onSuccess?: (response: any) => void;
  onError?: () => void;
}

interface UserProfile {
  picture: string;
  name: string;
}

interface AuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  authuser: string;
  prompt: string;
}

const TOKEN_KEY = 'auth_token';
const PROFILE_KEY = 'user_profile';

const Auth = ({ onSuccess, onError }: AuthProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check for existing token and profile on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedProfile = localStorage.getItem(PROFILE_KEY);
    
    if (storedToken && storedProfile) {
      try {
        const token: AuthToken = JSON.parse(storedToken);
        const profile: UserProfile = JSON.parse(storedProfile);
        
        // Check if token is expired (expires_in is in seconds)
        const tokenExpiry = new Date(token.expires_in * 1000);
        if (tokenExpiry > new Date()) {
          setUserProfile(profile);
          setIsLoggedIn(true);
        } else {
          // Token expired, clear storage
          handleLogout();
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        handleLogout();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setIsLoggedIn(false);
    setUserProfile(null);
    setIsDropdownOpen(false);
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        
        // Get user info from Google
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch user profile');
          }
          return res.json();
        });

        // Create or update user using the API
        const user = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          }),
        }).then(res => {
          if (!res.ok) {
            throw new Error('Failed to create/update user');
          }
          return res.json();
        });

        // Store token with user ID
        localStorage.setItem(TOKEN_KEY, JSON.stringify({
          ...response,
          userId: user.id,
          expires_in: Date.now() + (response.expires_in * 1000)
        }));

        setUserProfile({
          picture: user.picture || userInfo.picture,
          name: user.name || userInfo.name
        });
        setIsLoggedIn(true);
        onSuccess?.(response);
      } catch (error) {
        console.error('Error:', error);
        handleLogout();
        onError?.();
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      handleLogout();
      onError?.();
    },
    scope: 'profile email openid',
    flow: 'implicit',
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Error loading profile picture:', e);
    console.log('Failed image URL:', e.currentTarget.src);
    e.currentTarget.src = 'https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_48dp.png';
  };

  return (
    <div className="relative">
      {!isLoggedIn ? (
        <button
          onClick={() => login()}
          disabled={isLoading}
          className="flex items-center justify-center px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <>
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-4 h-4 mr-2"
              />
              Sign in
            </>
          )}
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            {userProfile?.picture ? (
              <img
                src={userProfile.picture}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-blue-500 transition-colors"
                onError={handleImageError}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500 text-sm">
                  {userProfile?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                {userProfile?.name}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Auth;