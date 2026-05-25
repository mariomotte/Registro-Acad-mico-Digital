/**
 * Heurística simple para adivinar el género por el primer nombre en español.
 * Si termina en 'a', se asume Femenino, de lo contrario Masculino.
 */
export function getGenderFromName(firstName?: string): 'M' | 'F' {
  if (!firstName) return 'M';
  const name = firstName.trim().split(/\s+/)[0].toLowerCase();
  
  // Nombres comunes masculinos que terminan en 'a' (ej. Luca, Andrea en italiano pero raro aquí)
  // Por defecto, si termina en 'a', asumimos que es femenino (F)
  if (name.endsWith('a')) {
    return 'F';
  }
  
  return 'M';
}

interface UserOrStudent {
  firstName?: string;
  lastName?: string;
  nombres?: string;
  apellidos?: string;
  sexo?: string;
  avatar_url?: string;
  avatarUrl?: string;
  foto?: string;
  foto_url?: string;
}

/**
 * Devuelve la ruta de la imagen de avatar para un usuario o estudiante.
 * Prioriza foto subida, luego sexo, y finalmente la heurística del nombre.
 */
export function getUserAvatar(item: UserOrStudent | null | undefined): string {
  if (!item) return '/avatars/male.svg';

  // 1. Si hay una foto subida, usarla
  const customPhoto = item.avatar_url || item.avatarUrl || item.foto || item.foto_url;
  if (customPhoto && customPhoto.trim() !== '') {
    return customPhoto;
  }

  // 2. Si se tiene el sexo registrado
  const sex = (item.sexo || '').trim().toUpperCase();
  if (sex === 'F' || sex === 'FEMENINO' || sex === 'FEMALE') {
    return '/avatars/female.svg';
  }
  if (sex === 'M' || sex === 'MASCULINO' || sex === 'MALE') {
    return '/avatars/male.svg';
  }

  // 3. Heurística basada en el nombre
  const name = item.firstName || item.nombres || '';
  if (getGenderFromName(name) === 'F') {
    return '/avatars/female.svg';
  }

  return '/avatars/male.svg';
}
