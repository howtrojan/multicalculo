// src/interfaces/cotation.ts (ou src/models/cotation.ts)

import { Timestamp } from "firebase/firestore"; // Importe Timestamp se você o utiliza para datas

/**
 * Interface Completa para o Documento de Cotação
 * Contém todas as sub-interfaces aninhadas.
 */
export interface CotationDocument {
  id: string; // ID do documento no Firestore
  userId: string;
  userEmail: string;
  createdAt: Timestamp; // Conforme o Firebase Timestamp

  // allInsurerQuotes (Array de Cotações das Seguradoras)
  allInsurerQuotes?: Array<{
    createdAt: string; // No seu JSON de exemplo, é string
    insurerLogo: string;
    insurerName: string;
    quoteId: string;
    status: string;
    totalPremium: string;
    message?: string;
    plan?: string;
    tenantName?: string;
    propertyAddress?: string;
  }>;

  // payload (O objeto principal com os dados da cotação)
  payload: {
    // commissionedAgents (Array de Agentes Comissionados)
    commissionedAgents?: Array<{
      commissionPercentage?: number;
      documentNumber: string;
      isPayer: boolean;
      lead: boolean;
      role: string;
    }>;

    // participants (Array de Participantes: Beneficiary, PolicyHolder, Insured)
    participants: Array<{
      address?: { // Endereço do participante
        city: string;
        country: string;
        district: string;
        number: string;
        state: string;
        street: string;
        type: string;
        zipCode: string;
      };
      contact: { // Contato do participante
        cellPhoneNumber: string;
        email: string;
        name: string;
        phoneNumber: string;
        documentNumber: string; // Este é o CPF/CNPJ
        participationPercentage?: number;
        main?: boolean;
      };
      role: string;
      participationPercentage?: number;
      main?: boolean;
    }>;

    // paymentConditions (Condições de Pagamento)
    paymentConditions: {
      installments: number;
      paymentType: string;
      policyPeriodEnd: string;
      policyPeriodStart: string;
      policyType: string;
    };

    // riskObjects (Array de Objetos de Risco)
    riskObjects: Array<{
      coverages: Array<{
        insuredAmount: number;
        key: string;
      }>;
      endLeaseContract: string;
      expenses: Array<{
        description: string;
        value: number;
      }>;
      inhabited: boolean;
      multiple: number;
      occupation: string;
      planKey: string;
      riskLocation: { // Localização do Risco
        address: { // Endereço do Local de Risco
          city: string;
          country: string;
          district: string;
          number: string;
          state: string;
          street: string;
          type: string;
          zipCode: string;
        };
        nationalCoverage: boolean;
      };
      startLeaseContract: string;
      tenantDocumentNumber: string; // CPF do inquilino
      type: string;
    }>;

    // Campos opcionais 'client' e 'property' no nível do payload, se existirem
    client?: {
      name: string;
      document: string; // Se existir, verificar se é 'document' ou 'documentNumber' aqui
      // ... outros campos do cliente ...
    };
    property?: {
      address: {
        city: string;
        country: string;
        district: string;
        number: string;
        state: string;
        street: string;
        type: string;
        zipCode: string;
      };
      // ... outros campos de propriedade se houver
    };
  };

  // cotacao (A cotação "principal" ou resumida)
  cotacao?: {
    insurerName: string;
    insurerLogo: string;
    quoteId: string;
    status: string;
    totalPremium: string;
    message?: string;
    plan?: string;
    tenantName?: string;
    propertyAddress?: string;
    createdAt?: string; // No seu JSON de exemplo, é string
  };
}