// src/routes.ts
//
// Single source of truth for every URL in the app.
// Never type a path literal anywhere else — import `routes` and use these
// instead. Changing a URL structure (e.g. /game/ -> /title/) means editing
// it ONCE here; every <Route>, navigate() call, and <Link> picks it up
// automatically.

export const routes = {
  root: "/",
  login: "/login",
  registration: "/registration",
  home: "/home",
  logs: "/logs",
  quickLog: "/quicklog",
  game: (gameName: string) => `/game/${gameName}`,
  gameLog: (gameName: string) => `/game/${gameName}/log`,
  profile: "/profile",
  reviews: "/profile/myreviews",
  review: (id: string) => `/reviews/${id}`,
  editReview: (id: string) => `/edit-review/${id}`,
  communityReviews: "/reviews",
  settings: "/settings",
  settingsUserProfile: "/settings/userprofile",
  settingsDeleteAccount: "/settings/deleteaccount",
  hallOfFame: "/hall-of-fame",
  stats: "/stats",
  about: "/about",
  myVaults: "/myVaults",
  vaultCreation: "/vaultcreation",
  vault: (id: string) => `/vault/${id}`,
  editVault: (id: string) => `/editvault/${id}`,
  communityVaults: "/vaults",
  publicVault: (id: string) => `/vaults/${id}`,
  savedVaults: "/savedvaults",
  upcomingGames: "/upcoming-games",
  completeProfile: "/complete-profile",
  notifications: "/api/notifications",
  verifyAccount: "/verify-account",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verification-confirmation",
  
} as const;