
export const stateContacts = {
  Lagos: [
    { id: 'police_lagos', name: 'Police', number: '112' },
    { id: 'army_lagos', name: 'Army', number: '070812711985' },
    { id: 'dss_lagos', name: 'DSS', number: '08082284982' },
    { id: 'ambulance_lagos', name: 'Ambulance', number: '199' },
    { id: 'fire_lagos', name: 'Fire', number: '199' },
  ],
  Kaduna: [
    { id: 'police_kaduna', name: 'Police', number: '112' },
    { id: 'army_kaduna', name: 'Army', number: '070812711985' },
    { id: 'dss_kaduna', name: 'DSS', number: '08082284982' },
    { id: 'ambulance_kaduna', name: 'Ambulance', number: '199' },
    { id: 'fire_kaduna', name: 'Fire', number: '199' },
  ],
  FCT: [
    { id: 'police_fct', name: 'Police', number: '112' },
    { id: 'army_fct', name: 'Army', number: '070812711985' },
    { id: 'dss_fct', name: 'DSS', number: '08082284982' },
    { id: 'ambulance_fct', name: 'Ambulance', number: '199' },
    { id: 'fire_fct', name: 'Fire', number: '199' },
  ],
};

export const getDefaultContactsForState = (state) => {
  return stateContacts[state] || stateContacts['Lagos'];
};