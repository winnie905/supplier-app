/** 登录模块视觉常量，集中管理颜色与圆角。 */
export const LOGIN_THEME = {
  pageBg: '#EEF2F8',
  cardBg: '#FFFFFF',
  inputBg: '#F5F8FD',
  primary: '#1768D2',
  primaryDisabled: 'rgba(23, 104, 210, 0.3)',
  textPrimary: '#1F2937',
  textSecondary: '#586689',
  textMuted: '#8A98AD',
  placeholder: '#C8D4E5',
  border: '#D8E1EF',
  tabActive: '#1768D2',
  tabInactive: '#8A98AD',
  cardRadius: 16,
  inputRadius: 8,
  cardShadow: {
    shadowColor: '#1A3A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
} as const;
