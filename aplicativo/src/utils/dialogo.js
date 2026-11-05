import { Alert, Platform } from 'react-native';

// Alert.alert() não faz nada na versão web, então usamos window.alert/confirm lá.
export function avisar(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
    return;
  }
  Alert.alert(titulo, mensagem);
}

// Retorna uma Promise: true se a pessoa confirmou, false se cancelou.
export function confirmar(titulo, mensagem, textoConfirmar = 'Confirmar') {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${titulo}\n\n${mensagem}`));
      return;
    }
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoConfirmar, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
