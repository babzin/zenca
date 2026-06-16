export const sendAlert = async (text, category = 'other', photoUri = null) => {
  const { lat, lng } = await getCurrentPosition(3);
  const device_uuid = await getDeviceUUID(); // get UUID

  let photoUrl = null;
  if (photoUri) {
    photoUrl = await uploadAlertPhoto(photoUri, device_uuid);
  }

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      text: text || null,
      category: category,
      location: `POINT(${lng} ${lat})`,
      photo_url: photoUrl,
      device_uuid: device_uuid, // explicitly include device_uuid
    })
    .select('id')
    .single();

  if (error) throw error;
  broadcastAlert(data.id, 'new');
  return data.id;
};