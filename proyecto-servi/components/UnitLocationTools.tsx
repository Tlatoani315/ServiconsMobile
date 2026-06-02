import { GoogleMapsActions } from './GoogleMapsActions';

type Props = {
  lat: number;
  lng: number;
  label?: string;
};

/** Pantalla 7 — coordenadas + abrir en Google Maps / navegar */
export function UnitLocationTools({ lat, lng, label = 'Ubicacion actual' }: Props) {
  return (
    <GoogleMapsActions
      lat={lat}
      lng={lng}
      label={label}
      coordsLabel={label}
      variant="full"
    />
  );
}
