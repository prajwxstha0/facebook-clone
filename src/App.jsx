import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Friends from './pages/Friends';
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Signup from './pages/Signup';

// If logged in → redirect to home
// If NOT logged in → show signup/login page
function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" /> : children;
}

// If logged in → show page
// If NOT logged in → redirect to signup
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signup" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public routes - only for NOT logged in users */}
          <Route path="/signup" element={
            <PublicRoute><Signup /></PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute><Signup /></PublicRoute>
          } />

          {/* Private routes - only for logged in users */}
          <Route path="/" element={
            <PrivateRoute><Home /></PrivateRoute>
          } />
          <Route path="/profile/:userId" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } /> 
          <Route path='/friends' element={ 
            <PrivateRoute><Friends/></PrivateRoute>
           }
          />

          <Route path="/notifications" element={
  <PrivateRoute><Notifications /></PrivateRoute>
} />

          {/* Any unknown route → go home */}
          // <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;