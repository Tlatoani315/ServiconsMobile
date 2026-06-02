import { Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'accent' | 'outline' | 'danger';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: 'bg-servi-primario active:bg-servi-primarioOscuro',
  accent: 'bg-servi-acento active:opacity-90',
  outline: 'border-2 border-servi-acento bg-transparent active:opacity-80',
  danger: 'bg-servi-peligro active:opacity-90',
};

const textClass: Record<Variant, string> = {
  primary: 'text-servi-texto',
  accent: 'text-servi-fondo',
  outline: 'text-servi-acento',
  danger: 'text-servi-texto',
};

export function AppButton({ label, variant = 'primary', loading, disabled, ...rest }: Props) {
  return (
    <Pressable
      className={`items-center rounded-xl px-6 py-4 ${variantClass[variant]} ${disabled || loading ? 'opacity-60' : ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      <Text className={`text-center text-base font-semibold ${textClass[variant]}`}>
        {loading ? 'Cargando...' : label}
      </Text>
    </Pressable>
  );
}
