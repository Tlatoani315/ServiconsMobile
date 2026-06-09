import type { BitacoraContactos, BitacoraFormulario } from '../types/models';

export function contactosFromFormulario(formulario: BitacoraFormulario): BitacoraContactos {
  if (formulario.contactos?.length) return formulario.contactos;
  if (formulario.whatsappGrupo) return [formulario.whatsappGrupo];
  return [];
}

export function parseContactos(raw: unknown): BitacoraContactos {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (item): item is BitacoraContactos[number] =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as BitacoraContactos[number]).remoteJid === 'string' &&
      typeof (item as BitacoraContactos[number]).pushName === 'string',
  );
}

export function resolveBitacoraContactos(
  column: unknown,
  formulario?: BitacoraFormulario | null,
): BitacoraContactos {
  const fromColumn = parseContactos(column);
  if (fromColumn.length) return fromColumn;
  if (formulario) return contactosFromFormulario(formulario);
  return [];
}

export function formatContactosLabel(contactos: BitacoraContactos): string {
  if (!contactos.length) return 'Sin contactos WhatsApp';
  return contactos.map((c) => c.pushName).join(', ');
}

export function primaryWhatsAppJid(contactos: BitacoraContactos): string | null {
  return contactos[0]?.remoteJid ?? null;
}
