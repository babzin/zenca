export interface DefaultContact {
  name: string;
  number: string;
}

export interface StateContacts {
  state: string;
  contacts: DefaultContact[];
}

const NATIONAL_DEFAULTS: DefaultContact[] = [
  { name: 'Nigeria Police (National)', number: '112' },
  { name: 'Emergency (National)', number: '199' },
  { name: 'Ambulance', number: '199' },
];

export const DEFAULT_STATE = 'Lagos';

const NIGERIA_CONTACTS: Record<string, DefaultContact[]> = {
  [DEFAULT_STATE]: NATIONAL_DEFAULTS,
};

export function getContactsForState(state: string): DefaultContact[] {
  return NIGERIA_CONTACTS[state] ?? NIGERIA_CONTACTS[DEFAULT_STATE];
}