import { Avatar, AvatarImage, HStack, Text, VStack } from 'design-system-native';
import { StyleSheet } from 'react-native';

import { avatarFallbackImage } from '@/components/images';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AuthUser } from '@/types';
import { buildFileUrl } from '@/utils/app';
import { getUserName } from '@/utils/core';

interface MeProfileSectionProps {
  user: AuthUser;
}

const AVATAR_SIZE = 56;

export const MeProfileSection = ({ user }: MeProfileSectionProps) => {
  const { colors, tokens } = useAppTheme();
  const avatarUrl = buildFileUrl(user.avatar);

  return (
    <HStack alignItems="center" style={{ gap: tokens.spacing.md, padding: tokens.spacing.lg }}>
      <Avatar style={styles.avatar}>
        <AvatarImage
          source={avatarUrl ? { uri: avatarUrl } : avatarFallbackImage}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </Avatar>

      <VStack style={{ flex: 1, gap: 4 }}>
        <Text
          strong
          style={{
            color: colors.text,
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: 700,
          }}
        >
          {getUserName(user)}
        </Text>

        <Text style={{ color: '#3E4958', fontSize: tokens.typography.fontSize.md }}>
          {user.email}
        </Text>
      </VStack>
    </HStack>
  );
};

const styles = StyleSheet.create({
  avatar: {
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    padding: 0,
    backgroundColor: 'transparent',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
});
