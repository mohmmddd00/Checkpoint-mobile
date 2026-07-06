import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "./src/screens/LoginScreen";
import Toast from "react-native-toast-message";
import { RegisterScreen } from "./src/screens/RegistrationScreen";
import { HomeScreen } from "./src/screens/HomeScreen";

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
  Review: { id: string };
  PublicVault: { id: string };
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
      </Stack.Navigator>
    </NavigationContainer>
    <Toast />
    </>
  );
}