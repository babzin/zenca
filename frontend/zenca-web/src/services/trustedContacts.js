// src/services/trustedContacts.js
import { supabase } from './supabase';
import { getDeviceUUID } from './device';

export const getTrustedContacts = async () => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('device_uuid', device_uuid)
      .order('is_primary', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch trusted contacts:', err);
    return [];
  }
};

export const addTrustedContact = async (name, phone, relationship, isPrimary = false) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data, error } = await supabase
      .from('trusted_contacts')
      .insert({
        device_uuid,
        name,
        phone,
        relationship,
        is_primary: isPrimary,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to add trusted contact:', err);
    throw new Error(err.message || 'Could not add contact.');
  }
};

export const updateTrustedContact = async (id, name, phone, relationship, isPrimary) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data, error } = await supabase
      .from('trusted_contacts')
      .update({ name, phone, relationship, is_primary: isPrimary })
      .eq('id', id)
      .eq('device_uuid', device_uuid)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to update trusted contact:', err);
    throw new Error(err.message || 'Could not update contact.');
  }
};

export const deleteTrustedContact = async (id) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { error } = await supabase
      .from('trusted_contacts')
      .delete()
      .eq('id', id)
      .eq('device_uuid', device_uuid);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete trusted contact:', err);
    throw new Error(err.message || 'Could not delete contact.');
  }
};