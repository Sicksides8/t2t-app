import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './firebase';

export async function uploadUserAvatar(localUri: string, userId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `t2t_avatars/${userId}/profile-${Date.now()}.jpg`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(fileRef);
}
