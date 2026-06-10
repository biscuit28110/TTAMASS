import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { logger } from '@/lib/logger';

interface Props { children: React.ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('ErrorBoundary', error.message, { stack: error.stack, componentStack: info.componentStack });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          Une erreur est survenue
        </Text>
        <ScrollView style={{ maxHeight: 300, backgroundColor: '#1E1E1E', borderRadius: 8, padding: 12, marginBottom: 24 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' }}>
            {error.message}{'\n\n'}{error.stack}
          </Text>
        </ScrollView>
        <Pressable
          onPress={() => this.setState({ error: null })}
          style={{ backgroundColor: '#E53935', borderRadius: 8, padding: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
}
