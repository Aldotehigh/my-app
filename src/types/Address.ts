export interface Address {
  recipient: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  references: string;
}

export function emptyAddress(recipient = ''): Address {
  return { recipient, phone: '', street: '', number: '', neighborhood: '', city: '', state: '', postal_code: '', references: '' };
}

export function completeAddress(address?: Partial<Address>): boolean {
  if (!address) return false;
  const required = ['recipient', 'street', 'neighborhood', 'city', 'state'] as const;
  const phone = (address.phone ?? '').replace(/\D/g, '').replace(/^52(?=\d{10}$)/, '');
  return required.every((field) => (address[field] ?? '').trim().length >= 2)
    && Boolean(address.number?.trim())
    && /^\d{10}$/.test(phone) && new Set(phone).size > 1
    && /^(?!00000)\d{5}$/.test(address.postal_code ?? '');
}

export function addressText(address: Partial<Address>) {
  return [
    address.recipient, address.phone,
    [address.street, address.number].filter(Boolean).join(' '),
    [address.neighborhood, address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.references,
  ].filter(Boolean).join('\n');
}
