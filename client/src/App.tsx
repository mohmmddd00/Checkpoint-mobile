import { Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthPage } from "./components/AuthPage";
import { WelcomePage } from "./components/WelcomePage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import "../src/styles/App.css";
import { LogsPage } from "./components/LogsPage";
import { QuickLogPage } from "./components/QuickLogPage";
import { GamePage } from "./components/GamePage";
import { routes } from "../../server/src/routes/routes";
import { ProfilePage } from "./components/ProfilePage";
import { ReviewPage } from "./components/ReviewPage";
import { AllReviewsPage } from "../src/components/AllUserReviews";
import { SettingsPage } from "./components/SettingsPage";
import { UserProfileSettingsPage } from "../src/components/UserProfileSettings";
import { DeleteAccountSettingsPage } from "./components/DeleteAccountSettings";
import { CommunityReviewsPage } from "../src/components/CommunityReviewsPage";
import { EditReviewPage } from "./components/EditReviewPage";
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import { VerifyAccountPage } from "./components/VerifyAccountPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { AboutPage } from "./components/AboutPage";
import { HallOfFamePage } from "./components/HallOfFamePage";
import { StatsPage } from "./components/StatsPage";
import { VaultCreationPage } from "./components/VaultCreationPage";
import { MyVaultsPage } from "./components/MyVaultsPage";
import { VaultPage } from "./components/VaultPage";
import { EditVaultPage } from "./components/EditVaultPage";
import { CommunityVaultsPage } from "./components/CommunityVaultsPage";
import { PublicVaultPage } from "./components/PublicVaultPage";
import { SavedVaultsPage } from "./components/SavedVaultsPage";
import { UpcomingGamesPage } from "./components/UpcomingGamesPage";
import { CompleteProfilePage } from "./components/CompleteProfilePage";

function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
    }
    navigate(routes.home, { replace: true });
  }, []);

  return null;
}

function App() {
  return (
    <>
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: "42%",
          transform: "translateY(-50%)",
        }}
      />
      <Routes>
        <Route path="/auth/callback" element={<GoogleCallback />} />
        <Route path={routes.verifyAccount} element={<VerifyAccountPage />} />
        <Route path={routes.verifyEmail} element={<VerifyEmailPage />} />
        <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
        <Route path={routes.root} element={<Navigate to={routes.login} replace />} />
        <Route path={routes.login} element={<AuthPage mode="login" />} />
        <Route path={routes.registration} element={<AuthPage mode="register" />} />
        <Route path={routes.home} element={ <ProtectedRoute> <WelcomePage /> </ProtectedRoute> } />
        <Route path={routes.logs} element={ <ProtectedRoute> <LogsPage /> </ProtectedRoute> } />
        <Route path={routes.profile} element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path={routes.review(":id")} element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
        <Route path={routes.editReview(":id")} element={<ProtectedRoute><EditReviewPage /></ProtectedRoute>} />
        <Route path={routes.reviews} element={<ProtectedRoute><AllReviewsPage /></ProtectedRoute>} />
        <Route path={routes.communityReviews} element={<ProtectedRoute><CommunityReviewsPage /></ProtectedRoute>} />
        <Route path={routes.settings} element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path={routes.settingsUserProfile} element={<ProtectedRoute><UserProfileSettingsPage /></ProtectedRoute>} />
        <Route path={routes.settingsDeleteAccount} element={<ProtectedRoute><DeleteAccountSettingsPage /></ProtectedRoute>} />
        <Route path={routes.quickLog} element={<ProtectedRoute><QuickLogPage /></ProtectedRoute>} />
        <Route path={routes.game(":gameName")} element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path={routes.gameLog(":gameName")} element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path={routes.hallOfFame} element={<ProtectedRoute><HallOfFamePage /></ProtectedRoute>} />
        <Route path={routes.stats} element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path={routes.about} element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
        <Route path={routes.vaultCreation} element={<ProtectedRoute><VaultCreationPage /></ProtectedRoute>} />
        <Route path={routes.myVaults} element={<ProtectedRoute><MyVaultsPage /></ProtectedRoute>} />
        <Route path={routes.vault(":id")} element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
        <Route path={routes.editVault(":id")} element={<ProtectedRoute><EditVaultPage /></ProtectedRoute>} />
        <Route path={routes.communityVaults} element={<ProtectedRoute><CommunityVaultsPage /></ProtectedRoute>} />
        <Route path={routes.publicVault(":id")} element={<ProtectedRoute><PublicVaultPage /></ProtectedRoute>} />
        <Route path={routes.savedVaults} element={<ProtectedRoute><SavedVaultsPage /></ProtectedRoute>} />
        <Route path={routes.upcomingGames} element={<ProtectedRoute><UpcomingGamesPage /></ProtectedRoute>} />
        <Route path={routes.completeProfile} element={<CompleteProfilePage />} />
        
        <Route path="*" element={<Navigate to={routes.login} replace />} />
      </Routes>
    </>
  );
}

export default App;