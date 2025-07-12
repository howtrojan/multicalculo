import admin from 'firebase-admin';

// As credenciais são lidas do arquivo JSON que você baixou
import serviceAccount from '../../firebase-admin-key.json'; 

// Evita a reinicialização do app a cada recarregamento em desenvolvimento
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Exportamos o 'auth' do admin para ser usado no nosso backend
const adminAuth = admin.auth();

export { adminAuth };