"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; // Importar User como FirebaseUser
import { auth, db } from "@/lib/firebase";
import axios from "axios";
import { addDoc, collection, serverTimestamp } from "firebase/firestore"; // Importações do Firestore
import Input from "../../components/formulario/Input";
import InputCpfCnpj from "../../components/formulario/InputCpfCnpj";
import InputCep from "../../components/formulario/InputCep";
import InputDate from "../../components/formulario/InputDate";
import InputSelect from "../../components/formulario/InputSelect";
import InputCurrency from "../../components/formulario/InputCurrency";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify"; // Importar a função toast

export default function FormularioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Removido os estados 'error' e 'success' pois as mensagens serão via toast
  // const [error, setError] = useState("");
  // const [success, setSuccess] = useState("");

  // Estado inicial do formulário
  const initialValues = {
    policyPeriodStart: "",
    policyPeriodEnd: "",
    brokerCnpj: "",
    brokerCommission: "",
    ownerCnpj: "",
    tenantCpf: "",
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    tenantAddress: "",
    tenantNumber: "",
    tenantDistrict: "",
    tenantCity: "",
    tenantState: "",
    tenantZip: "",
    propertyAddress: "",
    propertyNumber: "",
    propertyDistrict: "",
    propertyCity: "",
    propertyState: "",
    propertyZip: "",
    startLeaseContract: "",
    endLeaseContract: "",
    aluguel: "",
    condominio: "",
    iptu: "",
    planKey: "Basic",
    installments: "12",
    paymentType: "Invoice",
  };

  // Schema de validação Yup
  const validationSchema = Yup.object({
    policyPeriodStart: Yup.string().required("Obrigatório"),
    policyPeriodEnd: Yup.string().required("Obrigatório"),
    brokerCnpj: Yup.string().required("Obrigatório"),
    brokerCommission: Yup.number().min(0).max(100).required("Obrigatório"),
    ownerCnpj: Yup.string().required("Obrigatório"),
    tenantCpf: Yup.string().required("Obrigatório"),
    tenantName: Yup.string().required("Obrigatório"),
    tenantEmail: Yup.string().email("E-mail inválido").required("Obrigatório"),
    tenantPhone: Yup.string().required("Obrigatório"),
    tenantZip: Yup.string().required("Obrigatório"),
    tenantAddress: Yup.string().required("Obrigatório"),
    tenantNumber: Yup.string().required("Obrigatório"),
    tenantDistrict: Yup.string().required("Obrigatório"),
    tenantCity: Yup.string().required("Obrigatório"),
    tenantState: Yup.string().required("Obrigatório"),
    propertyZip: Yup.string().required("Obrigatório"),
    propertyAddress: Yup.string().required("Obrigatório"),
    propertyNumber: Yup.string().required("Obrigatório"),
    propertyDistrict: Yup.string().required("Obrigatório"),
    propertyCity: Yup.string().required("Obrigatório"),
    propertyState: Yup.string().required("Obrigatório"),
    startLeaseContract: Yup.string().required("Obrigatório"),
    endLeaseContract: Yup.string().required("Obrigatório"),
    aluguel: Yup.string().required("Obrigatório"),
    condominio: Yup.string().required("Obrigatório"),
    iptu: Yup.string().required("Obrigatório"),
    planKey: Yup.string().required("Obrigatório"),
    installments: Yup.string().required("Obrigatório"),
    paymentType: Yup.string().required("Obrigatório"),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    // Preenchimento automático para recalcular
    const recalc = localStorage.getItem("cotacao_recalcular");
    if (recalc) {
      try {
        // const dados = JSON.parse(recalc); // Removido ou comentado se não for usado
      } catch (e) {
        console.error("Erro ao preencher dados para recalcular:", e);
      }
      localStorage.removeItem("cotacao_recalcular");
    }
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoading(true);

    let docIdToPass: string | null = null; // Variável para armazenar o ID do documento do Firestore

    try {
      // Montar o payload conforme a documentação da Pottencial
      const payload = {
        policyPeriodStart: values.policyPeriodStart,
        policyPeriodEnd: values.policyPeriodEnd,
        policyType: "Unique",
        commissionedAgents: [
          {
            documentNumber: values.brokerCnpj,
            role: "Broker",
            commissionPercentage: Number(values.brokerCommission),
            lead: true,
            isPayer: false,
          },
          {
            documentNumber: values.ownerCnpj,
            role: "PolicyOwner",
            lead: false,
            isPayer: true,
          },
        ],
        participants: [
          {
            documentNumber: values.tenantCpf,
            participationPercentage: 1,
            role: "Beneficiary",
            address: {
              street: values.tenantAddress,
              number: values.tenantNumber,
              district: values.tenantDistrict,
              city: values.tenantCity,
              state: values.tenantState,
              zipCode: values.tenantZip,
              country: "BRA",
              type: "Residential",
            },
            contact: {
              name: values.tenantName,
              email: values.tenantEmail,
              phoneNumber: "",
              cellPhoneNumber: values.tenantPhone,
            },
          },
          {
            documentNumber: values.tenantCpf,
            role: "PolicyHolder",
            main: true,
            address: {
              street: values.tenantAddress,
              number: values.tenantNumber,
              district: values.tenantDistrict,
              city: values.tenantCity,
              state: values.tenantState,
              zipCode: values.tenantZip,
              country: "BRA",
              type: "Residential",
            },
            contact: {
              name: values.tenantName,
              email: values.tenantEmail,
              phoneNumber: "",
              cellPhoneNumber: values.tenantPhone,
            },
          },
          {
            documentNumber: values.tenantCpf,
            role: "Insured",
            address: {
              street: values.tenantAddress,
              number: values.tenantNumber,
              district: values.tenantDistrict,
              city: values.tenantCity,
              state: values.tenantState,
              zipCode: values.tenantZip,
              country: "BRA",
              type: "Residential",
            },
            contact: {
              name: values.tenantName,
              email: values.tenantEmail,
              phoneNumber: "",
              cellPhoneNumber: values.tenantPhone,
            },
          },
        ],
        riskObjects: [
          {
            type: "rentalProperty",
            tenantDocumentNumber: values.tenantCpf,
            startLeaseContract: values.startLeaseContract,
            endLeaseContract: values.endLeaseContract,
            coverages: [
              {
                key: "basica",
                insuredAmount:
                  Number(values.aluguel) +
                  Number(values.condominio) +
                  Number(values.iptu),
              },
            ],
            riskLocation: {
              nationalCoverage: false,
              address: {
                street: values.propertyAddress,
                number: values.propertyNumber,
                district: values.propertyDistrict,
                city: values.propertyCity,
                state: values.propertyState,
                zipCode: values.propertyZip,
                country: "BRA",
                type: "Residential",
              },
            },
            expenses: [
              { description: "VALOR_ALUGUEL", value: Number(values.aluguel) },
              {
                description: "VALOR_CONDOMINIO",
                value: Number(values.condominio),
              },
              { description: "VALOR_IPTU", value: Number(values.iptu) },
            ],
            planKey: values.planKey,
            occupation: "Residencial",
            inhabited: true,
            multiple: 30,
          },
        ],
        paymentConditions: {
          paymentType: values.paymentType,
          installments: Number(values.installments),
        },
      };

       const res = await axios.post("/api/fianca", payload);
    
    // 3. A RESPOSTA DA API (res.data) AGORA É O QUE IMPORTA!
    //    Ela já contém o array com Pottencial, Porto Seguro, etc.
    const quotesFromApi = res.data; 

    // A variável 'fakeResults' que existia aqui foi REMOVIDA.

    // 4. Salva os dados no Firestore
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = await addDoc(collection(db, "cotacoes"), {
          userId: currentUser.uid,
          userEmail: currentUser.email || "email_nao_disponivel",
          payload: payload, // Salva o payload original para referência
          allInsurerQuotes: quotesFromApi, // << AQUI ESTÁ A MUDANÇA PRINCIPAL!
          createdAt: serverTimestamp(),
        });
        
        docIdToPass = docRef.id;
        toast.success("Cotação enviada e salva com sucesso!", { theme: "colored" });

      } catch (firebaseErr: unknown) {
        let firebaseErrorMessage = "Erro ao salvar cotação no Firebase.";
        if (firebaseErr instanceof Error) {
          firebaseErrorMessage += `: ${firebaseErr.message}`;
        }
        console.error("Erro Firebase:", firebaseErrorMessage);
        toast.error(firebaseErrorMessage, { theme: "colored" });
      }
    } else {
      toast.error("Usuário não autenticado. Faça login novamente.", { theme: "colored" });
      router.push("/login");
      return; 
    }

    if (docIdToPass) {
      localStorage.setItem("lastCotacaoDocId", docIdToPass);
    }
    
    router.push("/resultado");

  } catch (err: unknown) {
    let errorMessage = "Erro inesperado ao enviar cotação.";
    if (err instanceof Error) {
      errorMessage += `: ${err.message}`;
    }
    toast.error(errorMessage, { theme: "colored" });
  } finally {
    setLoading(false);
    setSubmitting(false);
  }
};

  // Função para preencher endereço do locatário via CEP (mantida)
  const handleTenantCep = (address: any) => {
    // Estas linhas foram removidas pois o Formik gerencia o estado
    // setForm((prev) => ({
    //   ...prev,
    //   tenantAddress: address.logradouro || "",
    //   tenantDistrict: address.bairro || "",
    //   tenantCity: address.localidade || "",
    //   tenantState: address.uf || "",
    // }));
  };
  // Função para preencher endereço do imóvel via CEP (mantida)
  const handlePropertyCep = (address: any) => {
    // Estas linhas foram removidas pois o Formik gerencia o estado
    // setForm((prev) => ({
    //   ...prev,
    //   propertyAddress: address.logradouro || "",
    //   propertyDistrict: address.bairro || "",
    //   propertyCity: address.localidade || "",
    //   propertyState: address.uf || "",
    // }));
  };

  return (
    <div className="flex-1 p-6 flex flex-col bg-gradient-to-b from-secondary to-primary">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col p-10">
        <h2 className="text-2xl font-bold text-primary mb-6 text-start">
          FORMULÁRIO
        </h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form className="flex flex-col gap-6" autoComplete="off">
              {/* Período */}
              <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
                <h3 className="font-bold text-primary mb-2 text-2xl">
                  PERÍODO
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-10 gap-4">
                  <InputDate
                    label="Início"
                    name="policyPeriodStart"
                    value={values.policyPeriodStart}
                    onChange={(e) =>
                      setFieldValue("policyPeriodStart", e.target.value)
                    }
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <InputDate
                    label="Fim"
                    name="policyPeriodEnd"
                    value={values.policyPeriodEnd}
                    onChange={(e) =>
                      setFieldValue("policyPeriodEnd", e.target.value)
                    }
                    required
                    min={values.policyPeriodStart}
                  />
                </div>
              </div>
              {/* Corretor e Proprietário */}
              <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
                <h3 className="font-bold text-primary mb-2 text-2xl">
                  CORRETOR E PROPRIETARIO
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <div>
                    <InputCpfCnpj
                      label="CNPJ Proprietário"
                      name="ownerCnpj"
                      value={values.ownerCnpj}
                      onChange={(e) =>
                        setFieldValue("ownerCnpj", e.target.value)
                      }
                      required
                    />
                    <Input
                      label="% Comissão Corretor"
                      name="brokerCommission"
                      value={values.brokerCommission}
                      onChange={(e) =>
                        setFieldValue("brokerCommission", e.target.value)
                      }
                      required
                      type="number"
                      min="0"
                      max="100"
                    />
                  </div>
                  <InputCpfCnpj
                    label="CNPJ Corretor"
                    name="brokerCnpj"
                    value={values.brokerCnpj}
                    onChange={(e) =>
                      setFieldValue("brokerCnpj", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              {/* Locatário */}
              <div className="p-6 border border-gray-200 rounded-lg shadow-lg">
                <h3 className="font-bold text-primary mb-4 text-2xl">
                  PRETENDENTE
                </h3>

                {/* Grid principal com 12 colunas para maior flexibilidade */}
                <div className="grid grid-cols-1 sm:grid-cols-14 gap-x-4 gap-y-6">
                  {/* --- LINHA 1: DADOS DE CONTATO --- */}
                  <div className="sm:col-span-4">
                    <InputCpfCnpj
                      label="CPF/CNPJ Locatário"
                      name="tenantCpf"
                      value={values.tenantCpf}
                      onChange={(e) =>
                        setFieldValue("tenantCpf", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <Input
                      label="Nome Locatário"
                      name="tenantName"
                      value={values.tenantName}
                      onChange={(e) =>
                        setFieldValue("tenantName", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-7">
                    <Input
                      label="E-mail Locatário"
                      name="tenantEmail"
                      value={values.tenantEmail}
                      onChange={(e) =>
                        setFieldValue("tenantEmail", e.target.value)
                      }
                      required
                      type="email"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <Input
                      label="Celular Locatário"
                      name="tenantPhone"
                      value={values.tenantPhone}
                      onChange={(e) =>
                        setFieldValue("tenantPhone", e.target.value)
                      }
                      required
                      type="tel"
                    />
                  </div>

                  {/* --- DIVISOR E DADOS DE ENDEREÇO --- */}
                  {/* Este div ocupa a linha inteira, forçando os campos abaixo para uma nova linha */}
                  <div className="sm:col-span-12">
                    <div className="pt-4 border-t border-gray-200">
                      {/* Grid aninhado apenas para os campos de endereço */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-6">
                        {/* LINHA 2: Endereço (Parte 1) */}
                        <div className="sm:col-span-3">
                          <InputCep
                            label="CEP"
                            name="tenantZip"
                            value={values.tenantZip}
                            onChange={(e) =>
                              setFieldValue("tenantZip", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <Input
                            label="Endereço"
                            name="tenantAddress"
                            value={values.tenantAddress}
                            onChange={(e) =>
                              setFieldValue("tenantAddress", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            label="Número"
                            name="tenantNumber"
                            value={values.tenantNumber}
                            onChange={(e) =>
                              setFieldValue("tenantNumber", e.target.value)
                            }
                            required
                          />
                        </div>

                        {/* LINHA 3: Endereço (Parte 2) */}
                        <div className="sm:col-span-5">
                          <Input
                            label="Bairro"
                            name="tenantDistrict"
                            value={values.tenantDistrict}
                            onChange={(e) =>
                              setFieldValue("tenantDistrict", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <Input
                            label="Cidade"
                            name="tenantCity"
                            value={values.tenantCity}
                            onChange={(e) =>
                              setFieldValue("tenantCity", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            label="Estado"
                            name="tenantState"
                            value={values.tenantState}
                            onChange={(e) =>
                              setFieldValue("tenantState", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Imóvel */}
              <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
                <h3 className="font-bold text-primary mb-2 text-2xl">
                  IMÓVEL
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <InputCep
                    label="CEP"
                    name="propertyZip"
                    value={values.propertyZip}
                    onChange={(e) =>
                      setFieldValue("propertyZip", e.target.value)
                    }
                    required
                  />
                  <Input
                    label="Endereço"
                    name="propertyAddress"
                    value={values.propertyAddress}
                    onChange={(e) =>
                      setFieldValue("propertyAddress", e.target.value)
                    }
                    required
                  />
                  <Input
                    label="Número"
                    name="propertyNumber"
                    value={values.propertyNumber}
                    onChange={(e) =>
                      setFieldValue("propertyNumber", e.target.value)
                    }
                    required
                  />
                  <Input
                    label="Bairro"
                    name="propertyDistrict"
                    value={values.propertyDistrict}
                    onChange={(e) =>
                      setFieldValue("propertyDistrict", e.target.value)
                    }
                    required
                  />
                  <Input
                    label="Cidade"
                    name="propertyCity"
                    value={values.propertyCity}
                    onChange={(e) =>
                      setFieldValue("propertyCity", e.target.value)
                    }
                    required
                  />
                  <Input
                    label="Estado"
                    name="propertyState"
                    value={values.propertyState}
                    onChange={(e) =>
                      setFieldValue("propertyState", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              {/* Contrato */}
              <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
                <h3 className="font-bold text-primary mb-2 text-2xl">
                  CONTRATO
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-10 gap-4">
                  <InputDate
                    label="Início Contrato"
                    name="startLeaseContract"
                    value={values.startLeaseContract}
                    onChange={(e) =>
                      setFieldValue("startLeaseContract", e.target.value)
                    }
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <InputDate
                    label="Fim Contrato"
                    name="endLeaseContract"
                    value={values.endLeaseContract}
                    onChange={(e) =>
                      setFieldValue("endLeaseContract", e.target.value)
                    }
                    required
                    min={values.startLeaseContract}
                  />
                </div>
              </div>
              {/* Valores */}
              <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
                <h3 className="font-bold text-primary mb-2 text-2xl">
                  PRÊMIO
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-8 gap-4">
                  <InputCurrency
                    label="Valor do aluguel"
                    name="aluguel"
                    value={values.aluguel}
                    onChange={(e) => setFieldValue("aluguel", e.target.value)}
                    required
                  />
                  <InputCurrency
                    label="Valor do condomínio"
                    name="condominio"
                    value={values.condominio}
                    onChange={(e) =>
                      setFieldValue("condominio", e.target.value)
                    }
                    required
                  />
                  <InputCurrency
                    label="Valor do IPTU"
                    name="iptu"
                    value={values.iptu}
                    onChange={(e) => setFieldValue("iptu", e.target.value)}
                    required
                  />
                </div>
              </div>
              {/* Plano e Pagamento */}
              <div className="p-6 border border-gray-300 rounded-lg shadow-lg">
                <h3 className="font-bold text-primary mb-2 text-2xl">
                  PAGAMENTO
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-8 gap-4">
                  <InputSelect
                    label="Plano"
                    name="planKey"
                    value={values.planKey}
                    onChange={(e) => setFieldValue("planKey", e.target.value)}
                    required
                    options={[
                      { value: "Basic", label: "Básico" },
                      { value: "traditional", label: "Tradicional" },
                      { value: "complete", label: "Completo" },
                    ]}
                  />
                  <Input
                    label="Parcelas"
                    name="installments"
                    value={values.installments}
                    onChange={(e) =>
                      setFieldValue("installments", e.target.value)
                    }
                    required
                    type="number"
                    min="1"
                    max="12"
                  />
                  <InputSelect
                    label="Tipo de Pagamento"
                    name="paymentType"
                    value={values.paymentType}
                    onChange={(e) =>
                      setFieldValue("paymentType", e.target.value)
                    }
                    required
                    options={[
                      { value: "Invoice", label: "Fatura" },
                      { value: "Boleto", label: "Boleto" },
                    ]}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-secondary text-white font-semibold rounded px-6 py-4 transition-colors self-end"
                disabled={loading}
              >
                {loading ? "Cotando..." : "Enviar Cotação"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
