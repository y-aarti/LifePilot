import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TaskProvider } from '../hooks/useTasks';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { colors } from '../constants/theme';
function RouteGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    const atLogin = segments[0] === 'login';
    if (!user && !atLogin) router.replace('/login');
    else if (user && atLogin) router.replace('/');
  }, [user, loading, segments, router]);
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="create-task" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} /></Stack></>;
}
export default function RootLayout() {
  return <AuthProvider><TaskProvider><RouteGuard /></TaskProvider></AuthProvider>;
}
