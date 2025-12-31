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
import MobileBottomNav from "./components/MobileBottomNav";
import MobileHeader from "./components/MobileHeader";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import UserSearch from "./components/UserSearch";
import ToastProvider from "./context/ToastContext";

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const resolveTab = () => {
    if (location.pathname.startsWith("/chat")) return "chat";
    if (location.pathname.startsWith("/shop")) return "shop";
    if (location.pathname.startsWith("/squads")) return "squads";
    if (location.pathname.startsWith("/feedback")) return "ideas";
    if (location.pathname.startsWith("/profile")) return "profile";
    if (location.pathname.includes("search")) return "search";
    return "home";
  };

  const handleTabChange = (tab) => {
    switch (tab) {
      case "home":
        navigate("/feed");
        setMobileSearchOpen(false);
        break;
      case "chat":
        navigate("/chat");
        setMobileSearchOpen(false);
        break;
      case "shop":
        navigate("/shop");
        setMobileSearchOpen(false);
        break;
      case "squads":
        navigate("/squads");
        setMobileSearchOpen(false);
        break;
      case "ideas":
        navigate("/feedback");
        setMobileSearchOpen(false);
        break;
      case "search":
        setMobileSearchOpen(true);
        break;
      case "profile":
        if (user?.username) navigate(`/profile/${user.username}`);
        setMobileSearchOpen(false);
        break;
      default:
        navigate("/feed");
        setMobileSearchOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Cargando...
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen pb-20 md:pb-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 w-full overflow-x-hidden">
        {user && (
          <>
            <div className="hidden md:block">
              <NavBar />
            </div>
            <MobileHeader />
          </>
        )}
      <div className="max-w-7xl mx-auto px-0 md:px-4 py-3 md:py-6">
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
      {user && (
        <MobileBottomNav activeTab={resolveTab()} onChange={handleTabChange} />
      )}
       {user && mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm md:hidden">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3 text-slate-100">
              <span className="font-semibold">Buscar personas</span>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="px-3 py-1 rounded-full bg-slate-800 text-sm"
              >
                Cerrar
              </button>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 shadow-lg animate-[fadeIn_0.2s_ease]">
              <UserSearch />
            </div>
          </div>
        </div>
      )}
      </div>
    </ToastProvider>
  );
}

export default App;
