import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';

import Carregando from '../../components/Carregando';
import { useApp } from '../../context/AppContext';
import { cores } from '../../theme';

function icone(emoji) {
  return function Icone({ focused }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
  };
}

export default function LayoutAbas() {
  const { carregando, usuario, totalItens } = useApp();

  if (carregando) return <Carregando />;
  if (!usuario) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.verde,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: { backgroundColor: cores.cartao, borderTopColor: cores.borda },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: icone('🏠') }} />
      <Tabs.Screen name="alimentos" options={{ title: 'Alimentos', tabBarIcon: icone('🥗') }} />
      <Tabs.Screen
        name="carrinho"
        options={{
          title: 'Carrinho',
          tabBarIcon: icone('🛒'),
          tabBarBadge: totalItens > 0 ? totalItens : undefined,
        }}
      />
      <Tabs.Screen name="pedidos" options={{ title: 'Pedidos', tabBarIcon: icone('📦') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone('👤') }} />
    </Tabs>
  );
}
