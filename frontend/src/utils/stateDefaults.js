// Nigerian states emergency contacts (pre-loaded defaults)
export const stateContacts = {
  'Lagos': [
    { id: 'police_lagos', name: 'Police', number: '112' },
    { id: 'army_lagos', name: 'Army', number: '09012345678' },
    { id: 'dss_lagos', name: 'DSS', number: '08012345678' },
    { id: 'ambulance_lagos', name: 'Ambulance', number: '199' },
    { id: 'fire_lagos', name: 'Fire', number: '199' },
  ],
};
export const getDefaultContactsForState = (state) => {
  return stateContacts[state] || stateContacts['Lagos'];
};