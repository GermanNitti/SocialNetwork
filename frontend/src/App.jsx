import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import EditProfile from "./pages/EditProfile";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Lightbox from "./components/Lightbox";
import Squads from "./pages/Squads";
import SquadDetail from "./pages/SquadDetail";
import FeedbackPage from "./pages/Feedback";
import OnboardingWizard from "./components/OnboardingWizard";
import TagFeed from "./pages/TagFeed";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {user && <NavBar />}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {user && !user.hasCompletedOnboarding ? (
          <OnboardingWizard />
        ) : (
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/feed" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/feed" /> : <Register />} />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/squads"
              element={
                <ProtectedRoute>
                  <Squads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/squads/:id"
              element={
                <ProtectedRoute>
                  <SquadDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tag/:tagName"
              element={
                <ProtectedRoute>
                  <TagFeed />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/feed" />} />
            <Route path="*" element={<Navigate to="/feed" />} />
          </Routes>
        )}
      </div>
      <Lightbox />
    </div>
  );
}

export default App;
