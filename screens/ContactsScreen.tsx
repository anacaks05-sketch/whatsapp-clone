import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { supabase, Profile } from '../lib/supabase';

type ConversationItem = {
  conversation_id: string;
  other_user: Profile;
  last_message: string | null;
  last_message_at: string | null;
};

export default function ContactsScreen({ navigation, session }: any) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');

  const loadConversations = useCallback(async () => {
    setLoading(true);
    const userId = session.user.id;

    const { data: participantRows, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error || !participantRows) {
      setLoading(false);
      return;
    }

    const results: ConversationItem[] = [];

    for (const row of participantRows) {
      const { data: others } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles(*)')
        .eq('conversation_id', row.conversation_id)
        .neq('user_id', userId)
        .limit(1)
        .single();

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', row.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (others?.profiles) {
        results.push({
          conversation_id: row.conversation_id,
          other_user: others.profiles as unknown as Profile,
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? null,
        });
      }
    }

    results.sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return b.last_message_at.localeCompare(a.last_message_at);
    });

    setConversations(results);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    loadConversations();
    const unsubscribe = navigation.addListener('focus', loadConversations);
    return unsubscribe;
  }, [loadConversations, navigation]);

  async function startNewChat() {
    if (!searchEmail.trim()) return;

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', searchEmail.trim())
      .maybeSingle();

    if (!targetProfile) {
      alert('Nenhum usuário encontrado com esse e-mail.');
      return;
    }

    if (targetProfile.id === session.user.id) {
      alert('Você não pode iniciar uma conversa consigo mesmo.');
      return;
    }

    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({ is_group: false })
      .select()
      .single();

    if (convError || !newConv) return;

    await supabase.from('conversation_participants').insert([
      { conversation_id: newConv.id, user_id: session.user.id },
      { conversation_id: newConv.id, user_id: targetProfile.id },
    ]);

    setSearchEmail('');
    navigation.navigate('Chat', {
      conversationId: newConv.id,
      otherUser: targetProfile,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por e-mail"
          placeholderTextColor="#8696a0"
          autoCapitalize="none"
          keyboardType="email-address"
          value={searchEmail}
          onChangeText={setSearchEmail}
        />
        <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
          <Text style={styles.newChatButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#00a884" />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversation_id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhuma conversa ainda. Busque um contato pelo e-mail acima.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item.conversation_id,
                  otherUser: item.other_user,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.other_user.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.other_user.display_name}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.last_message ?? 'Nenhuma mensagem ainda'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b141a' },
  searchRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#202c33',
    color: '#e9edef',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newChatButton: {
    backgroundColor: '#00a884',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButtonText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2c34',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  rowText: { flex: 1 },
  name: { color: '#e9edef', fontSize: 16, fontWeight: '600' },
  preview: { color: '#8696a0', fontSize: 13, marginTop: 2 },
  empty: { color: '#8696a0', textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
});
