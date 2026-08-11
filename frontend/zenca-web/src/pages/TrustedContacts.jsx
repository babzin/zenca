import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getDeviceUUID } from '../services/device';
import { showToast } from '../utils/toast';
import ZencaLoader from '../components/ZencaLoader';

export default function TrustedContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const device_uuid = getDeviceUUID();

  const loadContacts = async () => {
    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('device_uuid', device_uuid)
      .order('is_primary', { ascending: false });
    if (!error) setContacts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadContacts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      showToast.error('Name and phone are required.');
      return;
    }
    try {
      if (editingId) {
        await supabase
          .from('trusted_contacts')
          .update({ name, phone, relationship, is_primary: isPrimary })
          .eq('id', editingId);
        showToast.success('✅ Contact updated!');
      } else {
        await supabase.from('trusted_contacts').insert({
          device_uuid,
          name,
          phone,
          relationship,
          is_primary: isPrimary,
        });
        showToast.success('✅ Contact added!');
      }
      setName(''); setPhone(''); setRelationship(''); setIsPrimary(false); setEditingId(null);
      loadContacts();
    } catch (err) {
      showToast.error('❌ ' + err.message);
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await supabase.from('trusted_contacts').delete().eq('id', id);
    loadContacts();
    showToast.success('🗑️ Contact deleted.');
  };

  const editContact = (c) => {
    setName(c.name);
    setPhone(c.phone);
    setRelationship(c.relationship || '');
    setIsPrimary(c.is_primary || false);
    setEditingId(c.id);
  };

  if (loading) return <ZencaLoader size="sm" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trusted Contacts</h1>
      <form onSubmit={handleSubmit} className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3">
        <input type="text" placeholder="Name" className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="tel" placeholder="Phone Number" className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="text" placeholder="Relationship (e.g., Family, Friend)" className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
          <span className="text-gray-700 dark:text-gray-300">Set as primary</span>
        </label>
        <button type="submit" className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md">
          {editingId ? 'Update' : 'Add'} Contact
        </button>
        {editingId && <button type="button" className="ml-2 text-sm text-gray-500" onClick={() => { setName(''); setPhone(''); setRelationship(''); setIsPrimary(false); setEditingId(null); }}>Cancel</button>}
      </form>
      <div className="mt-6 space-y-2">
        {contacts.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.phone} {c.is_primary && '(Primary)'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{c.relationship}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => editContact(c)} className="text-blue-600 hover:underline text-sm">Edit</button>
              <button onClick={() => deleteContact(c.id)} className="text-red-600 hover:underline text-sm">Delete</button>
            </div>
          </div>
        ))}
        {contacts.length === 0 && <p className="text-gray-500 dark:text-gray-400">No contacts added yet.</p>}
      </div>
    </div>
  );
}