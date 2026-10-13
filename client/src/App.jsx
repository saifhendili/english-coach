import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { hooks } from './lib/api';
import Chat from './pages/Chat';
import Conversation from './pages/Conversation';
import Home from './pages/Home';
import Interests from './pages/Interests';
import Login from './pages/Login';
import Phrases from './pages/Phrases';
import Progress from './pages/Progress';
import Placement from './pages/Placement';
import Review from './pages/Review';
import Settings from './pages/Settings';
import Topics from './pages/Topics';
import { useAuth } from './store/auth';

function RequireAuth() {
  const token = useAuth((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  const navigate = useNavigate();

  // Any API call answered with 412 KEY_MISSING sends the user to Settings.
  useEffect(() => {
    hooks.onKeyMissing = () => navigate('/settings');
    return () => {
      hooks.onKeyMissing = null;
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="placement" element={<Placement />} />
          <Route path="interests" element={<Interests />} />
          <Route path="topics" element={<Topics />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:id" element={<Conversation />} />
          <Route path="review" element={<Review />} />
          <Route path="progress" element={<Progress />} />
          <Route path="phrases" element={<Phrases />} />
          <Route path="phrases/:categoryId" element={<Phrases />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
