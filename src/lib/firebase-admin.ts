import admin from 'firebase-admin';

// Esta linha garante que a inicialização só aconteça uma vez.
if (!admin.apps.length) {
  // A inicialização AGORA usa as variáveis de ambiente que você configurou na Vercel.
  // Ela não procura mais pelo arquivo .json.
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Esta linha formata a chave privada que vem como texto da variável de ambiente.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Exporta o serviço de autenticação do admin para ser usado no seu backend.
const adminAuth = admin.auth();

export { adminAuth };