import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB82e0WH66OtPJmNDfgufK0ZPKtoP3rQfg',
  authDomain: 'escaladomingo.firebaseapp.com',
  projectId: 'escaladomingo',
  storageBucket: 'escaladomingo.firebasestorage.app',
  messagingSenderId: '831781420989',
  appId: '1:831781420989:web:2bfeaa569350d6a31d5cd4'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const snapDocs = snap => snap.docs.map(item => ({ id: item.id, ...item.data() }));

async function readCollection(name) {
  return snapDocs(await getDocs(collection(db, name)));
}

async function pull() {
  emit('firebase:status', { state: 'loading', message: 'Conectando ao Firestore...' });
  const [lojas, funcionarios, datas, disponibilidades, escalas, alocacoes, historicoFeriados, logs] = await Promise.all([
    readCollection('lojas'),
    readCollection('funcionarios'),
    readCollection('datas_especiais'),
    readCollection('disponibilidade_funcionario'),
    readCollection('escalas'),
    readCollection('escala_funcionarios'),
    readCollection('historico_feriados'),
    readCollection('logs')
  ]);

  const hasData = [lojas, funcionarios, datas, disponibilidades, escalas, alocacoes, historicoFeriados].some(list => list.length);
  if (!hasData) {
    emit('firebase:status', { state: 'connected', message: 'Firestore conectado · banco vazio' });
    return null;
  }

  const groupedSchedule = new Map();
  [...alocacoes, ...historicoFeriados].forEach(row => {
    const groupId = row.grupo_id || `${row.data}_${row.loja_id}`;
    if (!groupedSchedule.has(groupId)) groupedSchedule.set(groupId, {
      id: groupId,
      date: row.data,
      type: row.tipo,
      store: row.loja_id,
      employees: [],
      origin: row.origem || 'AUTOMATICA',
      notes: row.observacao || ''
    });
    if (row.funcionario_id && !groupedSchedule.get(groupId).employees.includes(row.funcionario_id)) groupedSchedule.get(groupId).employees.push(row.funcionario_id);
  });

  const remote = {
    stores: lojas.map(item => ({
      id: item.id, name: item.nome, active: item.ativo !== false,
      sunMin: Number(item.qtd_min_domingo || 0), holMin: Number(item.qtd_min_feriado || 0),
      openSun: item.aberta_domingo !== false, openHol: item.aberta_feriado !== false,
      fixedMin: item.qtd_fixos_escala ?? null
    })),
    employees: funcionarios.map(item => ({
      id: item.id, name: item.nome, role: item.cargo || '', active: item.ativo !== false,
      store: item.loja_fixa_id || item.loja_id || '', sundays: Number(item.domingos || 0), notes: item.observacoes || ''
    })),
    holidays: datas.filter(item => item.tipo === 'FERIADO').map(item => ({
      id: item.id, date: item.data, name: item.nome, category: item.categoria || 'Outro'
    })),
    openings: Object.fromEntries(datas.filter(item => item.tipo === 'FUNCIONAMENTO').map(item => [item.data, { mode: item.modo, stores: item.lojas_abertas || [] }])),
    schedule: [...groupedSchedule.values()],
    availability: Object.fromEntries(disponibilidades.map(item => [`${item.funcionario_id}|${item.data}`, item.disponivel])),
    monthStatus: Object.fromEntries(escalas.map(item => [item.id, item.status || 'Rascunho'])),
    logs: logs.sort((a, b) => String(b.data || '').localeCompare(String(a.data || ''))).map(item => ({
      at: item.data, action: item.acao, month: item.mes || ''
    }))
  };
  emit('firebase:status', { state: 'connected', message: 'Firestore conectado' });
  emit('firebase:data', remote);
  return remote;
}
const clean = value => JSON.parse(JSON.stringify(value));

async function syncCollection(name, records) {
  const ref = collection(db, name);
  const current = await getDocs(ref);
  const wanted = new Set(records.map(item => item.id));
  const removals = current.docs.filter(item => !wanted.has(item.id)).map(item => deleteDoc(item.ref));
  const writes = records.map(item => setDoc(doc(db, name, item.id), {
    ...clean(item.data), updated_at: serverTimestamp()
  }));
  await Promise.all([...removals, ...writes]);
}

async function flush(snapshot) {
  const monthKeys = new Set([
    ...Object.keys(snapshot.monthStatus || {}),
    ...(snapshot.schedule || []).filter(item => item.type === 'DOMINGO').map(item => item.date.slice(0, 7))
  ]);

  const escalaFuncionarios = [];
  (snapshot.schedule || []).forEach(group => {
    (group.employees || []).forEach(employeeId => escalaFuncionarios.push({
      id: `${group.id}_${employeeId}`,
      data: {
        escala_id: group.date.slice(0, 7), grupo_id: group.id,
        funcionario_id: employeeId, loja_id: group.store, data: group.date,
        tipo: group.type, origem: group.origin || 'AUTOMATICA', observacao: group.notes || ''
      }
    }));
  });

  const payloads = {
    lojas: (snapshot.stores || []).map(item => ({ id: item.id, data: {
      nome: item.name, ativo: item.active !== false,
      qtd_min_domingo: Number(item.sunMin || 0), qtd_min_feriado: Number(item.holMin || 0),
      aberta_domingo: item.openSun !== false, aberta_feriado: item.openHol !== false,
      qtd_fixos_escala: item.fixedMin ?? null
    }})),
    funcionarios: (snapshot.employees || []).map(item => ({ id: item.id, data: {
      nome: item.name, cargo: item.role || '', ativo: item.active !== false,
      loja_fixa_id: item.store || null, domingos: Number(item.sundays || 0), observacoes: item.notes || ''
    }})),
    funcionario_loja: (snapshot.employees || []).filter(item => item.store).map(item => ({
      id: `${item.id}_${item.store}_atual`, data: { funcionario_id: item.id, loja_id: item.store, tipo_vinculo: 'FIXO', ativo: true, data_inicio: null, data_fim: null }
    })),
    datas_especiais: [
      ...(snapshot.holidays || []).map(item => ({ id: item.id, data: {
        data: item.date, tipo: 'FERIADO', nome: item.name, categoria: item.category || 'Outro', ativo: true
      }})),
      ...Object.entries(snapshot.openings || {}).map(([date, item]) => ({ id: `func-${date}`, data: {
        data: date, tipo: 'FUNCIONAMENTO', modo: item.mode, lojas_abertas: item.stores || [], ativo: true
      }}))
    ],
    disponibilidade_funcionario: Object.entries(snapshot.availability || {}).map(([key, available]) => {
      const [employeeId, date] = key.split('|');
      return { id: `${employeeId}_${date}`, data: { funcionario_id: employeeId, data: date, disponivel: available, observacao: '' } };
    }),
    escalas: [...monthKeys].map(key => ({ id: key, data: {
      ano: Number(key.slice(0, 4)), mes: Number(key.slice(5, 7)), status: snapshot.monthStatus?.[key] || 'Rascunho'
    }})),
    escala_funcionarios: escalaFuncionarios,
    historico_feriados: escalaFuncionarios.filter(item => item.data.tipo === 'FERIADO'),
    logs: (snapshot.logs || []).slice(0, 250).map((item, index) => ({
      id: `${String(item.at || Date.now()).replace(/[^0-9A-Za-z]/g, '')}_${index}`,
      data: { data: item.at || new Date().toISOString(), acao: item.action || '', mes: item.month || '' }
    }))
  };

  for (const [name, records] of Object.entries(payloads)) await syncCollection(name, records);
  emit('firebase:status', { state: 'connected', message: 'Dados sincronizados com o Firestore' });
}

let timer;
let pending;
function push(snapshot) {
  pending = clean(snapshot);
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      emit('firebase:status', { state: 'loading', message: 'Salvando no Firestore...' });
      await flush(pending);
    } catch (error) {
      console.error('Falha ao salvar no Firestore:', error);
      emit('firebase:status', { state: 'blocked', message: 'Gravação bloqueada pelas regras do Firestore' });
    }
  }, 450);
}
window.firebaseBridge = { pull, push, db, projectId: firebaseConfig.projectId };

try {
  await pull();
} catch (error) {
  console.error('Falha ao conectar ao Firestore:', error);
  emit('firebase:status', {
    state: 'blocked',
    message: error?.code === 'permission-denied'
      ? 'Acesso bloqueado pelas regras do Firestore'
      : 'Não foi possível conectar ao Firestore'
  });
}
