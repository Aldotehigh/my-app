
export const lightColors = {
  background: '#F5EADB',
  surface: '#FFFAF1',
  text: '#2C211A',
  muted: '#6D6155',
  accent: '#7D251F',
  border: '#E3D4BF',
  soft: '#EEDDD0',
  olive: '#3F542B',
  onAccent: '#FFFFFF',
  successBackground: '#E9EFDE',
};

export type RestaurantColors = typeof lightColors;

// =============================================
// MODO OSCURO — YOTSUBA
// Inspirado en madera japonesa, vino y dorado
// =============================================

export const darkColors: RestaurantColors = {
  // Café oscuro cálido en lugar de negro
  background: '#211510',

  // Superficies ligeramente más claras
  surface: '#30211B',

  // Texto principal color crema
  text: '#F3DEC5',

  // Texto secundario cálido
  muted: '#C9B49E',

  // Rojo vino característico de Yotsuba
  accent: '#963A32',

  // Bordes dorados discretos
  border: '#B78C52',

  // Fondo de promociones y paneles
  soft: '#38241D',

  // Verde oliva para disponibilidad
  olive: '#BDD695',

  // Texto sobre botones color vino
  onAccent: '#FFF1DF',

  // Fondo de indicadores positivos
  successBackground: '#2C3B24',
};

// =============================================
// COLORES ORIGINALES
// =============================================

// Kept for components that have not adopted
// the preferences context yet.
export const colors = lightColors;

// =============================================
// ALTO CONTRASTE — MODO CLARO
// =============================================

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

// =============================================
// ALTO CONTRASTE — MODO OSCURO
// =============================================

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
