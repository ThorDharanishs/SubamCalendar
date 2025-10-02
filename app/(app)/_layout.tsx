import { Stack } from 'expo-router';

// This layout manages the screens in the (app) group.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
