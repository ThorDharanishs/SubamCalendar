import { Redirect } from 'expo-router';

// This is the main entry point of the app.
// It will check auth status and redirect accordingly.
export default function MainIndex() {
  // In a real application, you would replace this with a proper
  // authentication check (e.g., checking async storage or a context).
  const isAuthenticated = false; 

  if (isAuthenticated) {
    // If the user is logged in, redirect to the main app's home screen.
    return <Redirect href="/(app)" />;
  } else {
    // If the user is not logged in, redirect to the login screen.
    return <Redirect href="/(auth)/login" />;
  }
}

