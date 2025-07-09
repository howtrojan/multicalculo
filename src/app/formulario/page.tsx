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
import { toast } from 'react-toastify'; // Importar a função toast

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
    // Limpeza de erros/sucessos anteriores não é mais necessária para o estado, o toast gerencia
    // setError("");
    // setSuccess("");

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
                insuredAmount: Number(values.aluguel) + Number(values.condominio) + Number(values.iptu),
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
              { description: "VALOR_CONDOMINIO", value: Number(values.condominio) },
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

      // Simula a chamada à API interna (mantido, mas não afeta os resultados fictícios diretamente)
      const res = await axios.post("/api/fianca", payload);

      // --- CRIAÇÃO DAS COTAÇÕES FICTÍCIAS PARA MÚLTIPLAS SEGURADORAS ---
      const basePremium = Number(values.aluguel) * 0.05; // Exemplo de cálculo básico

      const fakeResults = [
        {
          insurerName: "Pottencial",
          insurerLogo: "/images/logos/pottencial.svg", // Caminho para o logo
          quoteId: `POT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: "Em análise",
          totalPremium: (basePremium * 1.05).toFixed(2), // Valor um pouco diferente
          message: "Cotação Pottencial gerada com sucesso!",
          plan: payload.riskObjects?.[0]?.planKey || "Basic",
          tenantName: payload.participants?.[0]?.contact?.name || "João da Silva",
          propertyAddress: payload.riskObjects?.[0]?.riskLocation?.address?.street || "Rua Exemplo, 123",
          createdAt: new Date().toISOString(),
        },
        {
          insurerName: "Porto Seguro",
          insurerLogo: "/images/logos/porto.svg", // Caminho para o logo
          quoteId: `POR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: "Aceita", // Exemplo de status diferente
          totalPremium: (basePremium * 1.10).toFixed(2),
          message: "Sua cotação foi aceita pela Porto Seguro!",
          plan: payload.riskObjects?.[0]?.planKey || "Basic",
          tenantName: payload.participants?.[0]?.contact?.name || "João da Silva",
          propertyAddress: payload.riskObjects?.[0]?.riskLocation?.address?.street || "Rua Exemplo, 123",
          createdAt: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(), // Data um pouco diferente
        },
        {
          insurerName: "Tokio Marine",
          insurerLogo: "/images/logos/tokio.svg", // Caminho para o logo
          quoteId: `TOK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: "Pendente", // Exemplo de status diferente
          totalPremium: (basePremium * 1.00).toFixed(2),
          message: "Tokio Marine está analisando sua proposta.",
          plan: payload.riskObjects?.[0]?.planKey || "Basic",
          tenantName: payload.participants?.[0]?.contact?.name || "João da Silva",
          propertyAddress: payload.riskObjects?.[0]?.riskLocation?.address?.street || "Rua Exemplo, 123",
          createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Data um pouco mais antiga
        },
      ];

      // --- LÓGICA PARA SALVAR NO FIREBASE FIRESTORE ---
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          // Adiciona o documento contendo o payload original E o array de fakeResults
          const docRef = await addDoc(collection(db, "cotacoes"), {
            userId: currentUser.uid,
            userEmail: currentUser.email || "email_nao_disponivel",
            payload: payload, // Salva o payload completo original
            allInsurerQuotes: fakeResults, // Salva o array de todas as cotações fictícias
            createdAt: serverTimestamp(), // Adiciona o timestamp do servidor Firebase
          });
          docIdToPass = docRef.id; // Guarda o ID do documento
          toast.success("Cotação enviada e salva com sucesso!", { theme: "colored" });
        } catch (firebaseErr: unknown) {
          let firebaseErrorMessage = "Erro ao salvar cotação no Firebase.";
          if (firebaseErr instanceof Error) {
            firebaseErrorMessage += `: ${firebaseErr.message}`;
          }
          console.error("Erro Firebase:", firebaseErrorMessage);
          toast.error(firebaseErrorMessage, { theme: "colored" });
          // Continua para mostrar o resultado local mesmo se o Firebase falhar
        }
      } else {
        toast.error("Usuário não autenticado. Faça login novamente.", { theme: "colored" });
        router.push("/login"); // Redireciona se não houver usuário logado
        return; // Sai da função para evitar processamento adicional
      }

      // SEMPRE VAI PARA A PÁGINA DE RESULTADOS COM OS DADOS FICTÍCIOS
      // Se um ID do Firestore foi salvo, usa ele. Caso contrário (e.g., erro no Firebase),
      // a página de resultados terá que lidar com a falta do ID e, talvez, cair no estado de "nenhum resultado".
      // Ou podemos salvar os fakeResults no localStorage como fallback.
      if (docIdToPass) {
          localStorage.setItem("lastCotacaoDocId", docIdToPass);
      } else {
          // Fallback: Se não conseguiu salvar no Firebase, ainda tenta mostrar os dados fictícios
          // na página de resultados diretamente do localStorage.
          // Note: Isso faria a página de resultados buscar do localStorage (antigo comportamento)
          // se o Firebase falhar, mas a questão era sempre buscar do Firebase.
          // O cenário mais seguro é que 'ResultadoPage' sempre tenta buscar do Firebase pelo ID.
          // Se não houver ID, ela mostra "Nenhum resultado".
          // Para "de qualquer maneira quero ir pra pagina de resultados com os dados ficticios",
          // o ideal é que ResultadoPage tenha um fallback se o ID nao vier.
          // Mas o pedido aqui é que a _FORMULARIO_PAGE_ sempre VÁ para RESULTADOS.
      }
      
      router.push("/resultado");

    } catch (err: unknown) { // Captura erros gerais (e.g., da chamada axios.post)
      let errorMessage = "Erro inesperado ao enviar cotação. Verifique os dados.";
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
    <div className="min-h-screen bg-gradient-to-b from-cyan-900 to-cyan-600 flex items-center justify-center py-10">
      <div className="w-4/5 mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-cyan-900 mb-6 text-center">Formulário: Fiança Locatícia</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form className="flex flex-col gap-6" autoComplete="off">
              {/* Período */}
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2">Período da Apólice</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputDate
                    label="Início"
                    name="policyPeriodStart"
                    value={values.policyPeriodStart}
                    onChange={(e) => setFieldValue("policyPeriodStart", e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <InputDate
                    label="Fim"
                    name="policyPeriodEnd"
                    value={values.policyPeriodEnd}
                    onChange={(e) => setFieldValue("policyPeriodEnd", e.target.value)}
                    required
                    min={values.policyPeriodStart}
                  />
                </div>
              </div>
              {/* Corretor e Proprietário */}
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2">Corretor e Proprietário</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputCpfCnpj
                    label="CNPJ Corretor"
                    name="brokerCnpj"
                    value={values.brokerCnpj}
                    onChange={(e) => setFieldValue("brokerCnpj", e.target.value)}
                    required
                  />
                  <Input
                    label="% Comissão Corretor"
                    name="brokerCommission"
                    value={values.brokerCommission}
                    onChange={(e) => setFieldValue("brokerCommission", e.target.value)}
                    required
                    type="number"
                    min="0"
                    max="100"
                  />
                  <InputCpfCnpj
                    label="CNPJ Proprietário"
                    name="ownerCnpj"
                    value={values.ownerCnpj}
                    onChange={(e) => setFieldValue("ownerCnpj", e.target.value)}
                    required
                  />
                </div>
              </div>
              {/* Locatário */}
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2">Locatário</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputCpfCnpj
                    label="CPF/CNPJ Locatário"
                    name="tenantCpf"
                    value={values.tenantCpf}
                    onChange={(e) => setFieldValue("tenantCpf", e.target.value)}
                    required
                  />
                  <Input label="Nome Locatário" name="tenantName" value={values.tenantName} onChange={(e) => setFieldValue("tenantName", e.target.value)} required />
                  <Input label="E-mail Locatário" name="tenantEmail" value={values.tenantEmail} onChange={(e) => setFieldValue("tenantEmail", e.target.value)} required type="email" />
                  <Input label="Celular Locatário" name="tenantPhone" value={values.tenantPhone} onChange={(e) => setFieldValue("tenantPhone", e.target.value)} required type="tel" />
                  <InputCep
                    label="CEP"
                    name="tenantZip"
                    value={values.tenantZip}
                    onChange={(e) => setFieldValue("tenantZip", e.target.value)}                    
                    required
                  />
                  <Input label="Endereço" name="tenantAddress" value={values.tenantAddress} onChange={(e) => setFieldValue("tenantAddress", e.target.value)} required />
                  <Input label="Número" name="tenantNumber" value={values.tenantNumber} onChange={(e) => setFieldValue("tenantNumber", e.target.value)} required />
                  <Input label="Bairro" name="tenantDistrict" value={values.tenantDistrict} onChange={(e) => setFieldValue("tenantDistrict", e.target.value)} required />
                  <Input label="Cidade" name="tenantCity" value={values.tenantCity} onChange={(e) => setFieldValue("tenantCity", e.target.value)} required />
                  <Input label="Estado" name="tenantState" value={values.tenantState} onChange={(e) => setFieldValue("tenantState", e.target.value)} required />
                </div>
              </div>
              {/* Imóvel */}
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2">Imóvel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputCep
                    label="CEP"
                    name="propertyZip"
                    value={values.propertyZip}
                    onChange={(e) => setFieldValue("propertyZip", e.target.value)}                    
                    required
                  />
                  <Input label="Endereço" name="propertyAddress" value={values.propertyAddress} onChange={(e) => setFieldValue("propertyAddress", e.target.value)} required />
                  <Input label="Número" name="propertyNumber" value={values.propertyNumber} onChange={(e) => setFieldValue("propertyNumber", e.target.value)} required />
                  <Input label="Bairro" name="propertyDistrict" value={values.propertyDistrict} onChange={(e) => setFieldValue("propertyDistrict", e.target.value)} required />
                  <Input label="Cidade" name="propertyCity" value={values.propertyCity} onChange={(e) => setFieldValue("propertyCity", e.target.value)} required />
                  <Input label="Estado" name="propertyState" value={values.propertyState} onChange={(e) => setFieldValue("propertyState", e.target.value)} required />
                </div>
              </div>
              {/* Contrato */}
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2">Contrato</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputDate
                    label="Início Contrato"
                    name="startLeaseContract"
                    value={values.startLeaseContract}
                    onChange={(e) => setFieldValue("startLeaseContract", e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <InputDate
                    label="Fim Contrato"
                    name="endLeaseContract"
                    value={values.endLeaseContract}
                    onChange={(e) => setFieldValue("endLeaseContract", e.target.value)}
                    required
                    min={values.startLeaseContract}
                  />
                </div>
              </div>
              {/* Valores */}
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2">Valores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputCurrency label="Valor do aluguel" name="aluguel" value={values.aluguel} onChange={(e) => setFieldValue("aluguel", e.target.value)} required />
                  <InputCurrency label="Valor do condomínio" name="condominio" value={values.condominio} onChange={(e) => setFieldValue("condominio", e.target.value)} required />
                  <InputCurrency label="Valor do IPTU" name="iptu" value={values.iptu} onChange={(e) => setFieldValue("iptu", e.target.value)} required />
                </div>
              </div>
              {/* Plano e Pagamento */}
              <div>
                <h3 className="font-semibold text-cyan-800 mb-2">Plano e Pagamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onChange={(e) => setFieldValue("installments", e.target.value)}
                    required
                    type="number"
                    min="1"
                    max="12"
                  />
                  <InputSelect
                    label="Tipo de Pagamento"
                    name="paymentType"
                    value={values.paymentType}
                    onChange={(e) => setFieldValue("paymentType", e.target.value)}
                    required
                    options={[
                      { value: "Invoice", label: "Fatura" },
                      { value: "Boleto", label: "Boleto" },
                    ]}
                  />
                </div>
              </div>
              {/* Removido os divs de erro e sucesso, as mensagens serão via Toast */}
              {/* {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {success && <div className="text-green-600 text-sm text-center">{success}</div>} */}
              <button type="submit" className="bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded px-4 py-2 transition-colors self-end" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Cotação"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}