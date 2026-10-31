import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { WaveHeader } from '../components/WaveHeader';
export default function Login() {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try { if (mode === 'login') await signIn(email.trim(), password); else await signUp(email.trim(), password); }
    catch (reason) { setError(messageFor(reason)); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe}><WaveHeader title={mode === 'login' ? 'Welcome Back' : 'Create Account'} /><KeyboardAvoidingView style={s.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.cardWrap} keyboardShouldPersistTaps="handled"><View style={s.card}>
      <View style={s.brandMark}><Text style={s.mark}>L</Text></View><Text style={s.brand}>Life</Text>
      <Text style={s.subtitle}>{mode === 'login' ? 'Log in to your account' : 'Create your account'}</Text>
      <View style={s.switcher}><TouchableOpacity onPress={() => { setMode('login'); setError(''); }} style={[s.switchOption, mode === 'login' && s.switchActive]}><Text style={[s.switchText, mode === 'login' && s.switchTextActive]}>Log in</Text></TouchableOpacity><TouchableOpacity onPress={() => { setMode('signup'); setError(''); }} style={[s.switchOption, mode === 'signup' && s.switchActive]}><Text style={[s.switchText, mode === 'signup' && s.switchTextActive]}>Sign up</Text></TouchableOpacity></View>
      <Text style={s.label}>Email</Text><TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA4BB" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
      <View style={s.passwordLabelRow}><Text style={s.label}>Password</Text><TouchableOpacity onPress={() => setShowPassword(value => !value)} accessibilityRole="button"><Text style={s.showPassword}>{showPassword ? 'Hide' : 'Show'}</Text></TouchableOpacity></View><TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor="#9AA4BB" secureTextEntry={!showPassword} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} textContentType={mode === 'signup' ? 'newPassword' : 'password'} returnKeyType={mode === 'signup' ? 'next' : 'go'} onSubmitEditing={mode === 'login' ? submit : undefined} />
      {mode === 'signup' && <><Text style={s.label}>Confirm password</Text><TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your password" placeholderTextColor="#9AA4BB" secureTextEntry={!showPassword} autoComplete="new-password" textContentType="newPassword" onSubmitEditing={submit} returnKeyType="go" /></>}
      {!configured && <Text style={s.setup}>Add your Firebase project settings to .env.local to enable login.</Text>}
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TouchableOpacity disabled={busy} onPress={submit} style={[s.button, busy && { opacity: 0.65 }]}><Text style={s.buttonText}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Text></TouchableOpacity>
    </View></ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
function messageFor(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'Email or password is incorrect.';
  if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/weak-password') return 'Choose a password with at least 6 characters.';
  return error instanceof Error ? error.message : 'Unable to complete sign in.';
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, center: { flex: 1 }, cardWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: colors.white, borderRadius: 22, padding: 28, shadowColor: '#30447F', shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  brandMark: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 }, mark: { color: colors.white, fontSize: 23, fontWeight: '700' }, brand: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' }, subtitle: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  switcher: { flexDirection: 'row', backgroundColor: colors.paleBlue, borderRadius: 11, padding: 4, marginBottom: 22 }, switchOption: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 }, switchActive: { backgroundColor: colors.blue, elevation: 1 }, switchText: { color: colors.muted, fontSize: 13, fontWeight: '600' }, switchTextActive: { color: colors.white },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, label: { color: colors.ink, fontSize: 12, fontWeight: '600', marginBottom: 7 }, showPassword: { color: colors.blue, fontSize: 12, fontWeight: '600', marginBottom: 7 }, input: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#B9D5FF', backgroundColor: '#FFFFFF', color: colors.ink, fontSize: 14, paddingHorizontal: 13, marginBottom: 17 },
  setup: { color: '#69769A', backgroundColor: '#F1F4FC', borderRadius: 9, padding: 10, fontSize: 11, lineHeight: 16, marginBottom: 13 }, error: { color: '#B23E58', fontSize: 12, marginBottom: 12 }, button: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.blue, marginTop: 3 }, buttonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
