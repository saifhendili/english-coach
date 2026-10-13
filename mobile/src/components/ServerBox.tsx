import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Card, Icon, TextField } from '@/components/ui';
import { defaultServer, normalizeServer } from '@/lib/config';
import { getServer, useAuth } from '@/store/auth';
import { useTheme } from '@/theme';

// Where the English Coach server is. Detected automatically when running from the Expo dev server on the same
// Wi-Fi; otherwise the learner types their computer's address once.
export function ServerBox({ forceOpen }: { forceOpen: boolean }) {
  const { colors } = useTheme();
  const saved = useAuth((s) => s.server);
  const setServer = useAuth((s) => s.setServer);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(saved ?? '');
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const current = getServer();
  const shown = open || forceOpen;

  const test = async () => {
    const origin = normalizeServer(text);
    if (!origin) return setNote({ ok: false, message: 'That does not look like an address. Try something like 192.168.1.9' });
    setTesting(true);
    setNote(null);
    try {
      const res = await fetch(`${origin}/api/health`);
      if (!res.ok) throw new Error(String(res.status));
      await setServer(origin);
      setText(origin);
      setNote({ ok: true, message: `Connected to ${origin}` });
    } catch {
      setNote({ ok: false, message: `Could not reach ${origin}. Check that the server is running and that your phone is on the same Wi-Fi.` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel="Server settings" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' }}>
        <Icon name="server-outline" size={16} color="muted" />
        <AppText variant="small" color="muted">
          {current ? `Server: ${current.replace(/^https?:\/\//, '')}` : 'Server: not set'}
        </AppText>
        <Icon name={shown ? 'chevron-up' : 'chevron-down'} size={14} color="muted" />
      </Pressable>
      {shown ? (
        <Card style={{ gap: 12 }}>
          <TextField
            label="Server address"
            value={text}
            onChangeText={setText}
            placeholder="192.168.1.9"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            hint="The address of the computer running English Coach, on the same Wi-Fi. The port 4000 is added for you."
          />
          {note ? (
            <AppText variant="small" weight="600" style={{ color: note.ok ? colors.successText : colors.dangerText }}>
              {note.message}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Test and save" icon="checkmark-circle-outline" size="sm" loading={testing} onPress={test} />
            {saved ? <Button title="Use detected" variant="ghost" size="sm" onPress={() => { void setServer(null); setText(''); setNote(null); }} /> : null}
          </View>
          {!saved && defaultServer() ? (
            <AppText variant="caption" color="muted">Detected automatically from the Expo dev server.</AppText>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}
