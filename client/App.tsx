import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "./src/screens/LoginScreen";
import Toast from "react-native-toast-message";
import { RegisterScreen } from "./src/screens/RegistrationScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SavedVaultsScreen } from "./src/screens/SavedVaultsScreen";
import { PublicVaultScreen } from "./src/screens/PublicVaultScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import { VaultScreen } from "./src/screens/VaultScreen";
import { MyVaultsScreen } from "./src/screens/MyVaultsScreen";
import { EditVaultScreen } from "./src/screens/EditVaultScreen";
import { VaultCreationScreen } from "./src/screens/VaultCreationScreen";
import { AllUserReviewsScreen } from "./src/screens/AllUserReviewsScreen";
import { ReviewScreen } from "./src/screens/ReviewScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  VerifyAccount: { email: string };
  ForgotPassword: undefined;
  Profile: undefined;
  Logs: undefined;
  CommunityReviews: undefined;
  UpcomingGames: undefined;
  HallOfFame: undefined;
  About: undefined;
  Settings: undefined;
  QuickLog: undefined;
  Game: { slug: string; game: any };
  Review: { id: string; log?: any };
  PublicVault: { id: string };
  Stats: undefined;
  VaultCreation: undefined;
  MyVaults: undefined;
  Vault: { id: string; vault?: any };
  EditVault: { id: string };
  Reviews: undefined;
  SavedVaults: undefined;
  CommunityVaults: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="SavedVaults" component={SavedVaultsScreen} />
        <Stack.Screen name="PublicVault" component={PublicVaultScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Vault" component={VaultScreen} />
        <Stack.Screen name="MyVaults" component={MyVaultsScreen} />
        <Stack.Screen name="EditVault" component={EditVaultScreen} />
        <Stack.Screen name="VaultCreation" component={VaultCreationScreen} />
        <Stack.Screen name="Reviews" component={AllUserReviewsScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    <Toast />
    </>
  );
}