import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getDeviceUUID } from '../services/device';
import { showToast } from '../utils/toast';
import ZencaLoader from '../components/ZencaLoader';

export default function GuardianApplication() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    certification: 'first_aid',
    certificationId: '',
    insuranceProvider: '',
    insurancePolicy: '',
    nin: '',
    bvn: '',
    ref1Name: '',
    ref1Phone: '',
    ref2Name: '',
    ref2Phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const device_uuid = getDeviceUUID();
      const { data, error } = await supabase.from('guardian_applications').insert({
        device_uuid,
        full_name: form.fullName,
        phone: form.phone,
        email: form.email,
        certification: form.certification,
        certification_id: form.certificationId,
        insurance_provider: form.insuranceProvider,
        insurance_policy: form.insurancePolicy,
        nin: form.nin,
        bvn: form.bvn,
        ref1_name: form.ref1Name,
        ref1_phone: form.ref1Phone,
        ref2_name: form.ref2Name,
        ref2_phone: form.ref2Phone,
        status: 'pending',
      });
      if (error) throw error;
      showToast.success('✅ Application submitted!');
      navigate('/guardian');
    } catch (err) {
      showToast.error('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ZencaLoader size="lg" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apply to be a Guardian</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
          <input type="text" name="fullName" required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.fullName} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</label>
          <input type="tel" name="phone" required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input type="email" name="email" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Certification</label>
          <select name="certification" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.certification} onChange={handleChange}>
            <option value="first_aid">First Aid</option>
            <option value="off_duty_medic">Off-duty Medic</option>
            <option value="police">Police</option>
            <option value="security">Security</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Certification ID</label>
          <input type="text" name="certificationId" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.certificationId} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Insurance Provider</label>
          <input type="text" name="insuranceProvider" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.insuranceProvider} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Insurance Policy Number</label>
          <input type="text" name="insurancePolicy" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.insurancePolicy} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NIN *</label>
          <input type="text" name="nin" required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.nin} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">BVN *</label>
          <input type="text" name="bvn" required className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.bvn} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference 1 Name</label>
          <input type="text" name="ref1Name" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.ref1Name} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference 1 Phone</label>
          <input type="tel" name="ref1Phone" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.ref1Phone} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference 2 Name</label>
          <input type="text" name="ref2Name" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.ref2Name} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference 2 Phone</label>
          <input type="tel" name="ref2Phone" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" value={form.ref2Phone} onChange={handleChange} />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}