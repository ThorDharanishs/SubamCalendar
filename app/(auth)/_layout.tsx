import { Stack } from 'expo-router';

// This layout manages the screens in the (auth) group.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
