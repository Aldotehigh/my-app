import { Platform } from 'react-native';

export const restaurantBrand = {
  name: 'YOTSUBA SUSHI',
  tagline: 'Contemporary Japanese cuisine',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  ink: '#291B17',
  cream: '#FAEFDC',
  gold: '#D9BB8C',
};
