import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDAS_TODAS, cores } from '../theme';

// Base de todas as telas: área segura, rolagem e teclado.
export default function Tela({ children, bordas = BORDAS_TODAS, estiloConteudo }) {
  return (
    <SafeAreaView style={styles.container} edges={bordas}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.conteudo, estiloConteudo]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1, padding: 20, paddingBottom: 32 },
});
