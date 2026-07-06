import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

export function SavedVaultsButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      style={s.btn}
      onPress={() => navigation.navigate("SavedVaults")}
      activeOpacity={0.75}
    >
      <Text style={s.text}>💾 Saved Vaults</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: "rgba(158,27,50,0.12)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.4)",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  text: {
    color: "#E6A1B0",
    fontSize: 12,
    fontWeight: "700",
  },
});