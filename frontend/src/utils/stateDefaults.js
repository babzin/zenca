
export const stateContacts = {
  'Lagos': [
    { id: 'police_lagos', name: 'Police', number: '112' },
    { id: 'army_lagos', name: 'Army', number: '09012345678' },
    { id: 'dss_lagos', name: 'DSS', number: '08082284982' },
    { id: 'ambulance_lagos', name: 'Ambulance', number: '112' },
    { id: 'fire_lagos', name: 'Fire', number: '112' },
  ],
};
export const getDefaultContactsForState = (state) => {
  return stateContacts[state] || stateContacts['Lagos'];
};