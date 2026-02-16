/**
 * Sample React Native App - SigNoz OpenTelemetry Test
 */

import { useTracer } from './hooks/tracing';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useState } from 'react';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { loaded: tracerLoaded } = useTracer();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent tracerLoaded={tracerLoaded} />
    </SafeAreaProvider>
  );
}

function AppContent({ tracerLoaded }: { tracerLoaded: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();
  const [response, setResponse] = useState<string>('');

  const makeTestRequest = async () => {
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top + 20 }]}>
      <Text style={styles.title}>SigNoz OTel Test</Text>
      <Text style={styles.status}>
        Tracer: {tracerLoaded ? 'Ready' : 'Loading...'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={makeTestRequest}>
        <Text style={styles.buttonText}>Make Test Request</Text>
      </TouchableOpacity>
      {response ? (
        <View style={styles.responseBox}>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#e2632d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  responseBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '100%',
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default App;
