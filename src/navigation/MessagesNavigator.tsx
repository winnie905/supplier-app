import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createStackScreenOptions } from '@/navigation/stackScreenOptions';
import type { MessagesStackParamList } from '@/navigation/types';
import { MessagesHomePage } from '@/pages/messages/MessagesHomePage';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export const MessagesNavigator = () => {
  const { colors, colorMode, tokens } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) =>
        createStackScreenOptions({
          navigation,
          colors,
          colorMode,
          tokens,
        })
      }
    >
      <Stack.Screen
        component={MessagesHomePage}
        name={ROUTES.MESSAGES.MESSAGES_HOME}
        options={{ title: '消息' }}
      />
    </Stack.Navigator>
  );
};
