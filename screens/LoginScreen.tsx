import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Preencha e-mail e senha');
      return;
    }
    if (password.length < 6) {
      Alert.alert('A senha precisa ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setLoading(false);
      Alert.alert('Erro ao cadastrar', error.message);
      return;
    }

    if (displayName.trim() && data.user) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', data.user.id);
    }
    setLoading(false);

    if (!data.session) {
      Alert.alert(
        'Confirme seu e-mail',
        'Enviamos um link de confirmação para o seu e-mail. Confirme e faça login.'
      );
      setMode('login');
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Preencha e-mail e senha');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>💬</Text>
      <Text style={styles.title}>Bem-vindo</Text>
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Entre com seu e-mail e senha' : 'Crie sua conta'}
      </Text>

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor="#8696a0"
          value={displayName}
          onChangeText={setDisplayName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#8696a0"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#8696a0"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={mode === 'login' ? handleLogin : handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={styles.link}>
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b141a',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e9edef',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8696a0',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#202c33',
    color: '#e9edef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#00a884',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#00a884', textAlign: 'center', marginTop: 16 },
});
