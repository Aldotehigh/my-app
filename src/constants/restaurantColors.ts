export const lightColors = {
  background: '#F7F0E6', surface: '#FFFDF8', text: '#292119',
  muted: '#675B50', accent: '#8D3728', border: '#E9DED0',
  soft: '#F8E6E1', olive: '#3F542B', onAccent: '#FFFFFF',
  successBackground: '#E9EFDE',
};
export type RestaurantColors = typeof lightColors;

export const darkColors: RestaurantColors = {
  background: '#181511', surface: '#25201B', text: '#F8F0E6',
  muted: '#C6B8A7', accent: '#F3A18A', border: '#514438',
  soft: '#422B25', olive: '#BDD695', onAccent: '#281510',
  successBackground: '#2C3B24',
};

// Kept for components that have not adopted the preferences context yet.
export const colors = lightColors;

export const highContrastLightColors: RestaurantColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111111',
  muted: '#333333',
  accent: '#6F200C',
  border: '#554433',
  soft: '#FFE4D3',
  olive: '#234500',
  onAccent: '#FFFFFF',
  successBackground: '#E3F1D0',
};

export const highContrastDarkColors: RestaurantColors = {
  background: '#000000',
  surface: '#101010',
  text: '#FFFFFF',
  muted: '#EEEEEE',
  accent: '#FFD0B5',
  border: '#CCCCCC',
  soft: '#342218',
  olive: '#D3FF9C',
  onAccent: '#000000',
  successBackground: '#1C2C0F',
};
