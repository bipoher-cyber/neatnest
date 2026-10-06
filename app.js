/* ============================================================
   NeatNest - Tareas del hogar
   Todo se guarda en el navegador (localStorage).
   ============================================================ */

// --- Claves para guardar en el navegador ---
const CLAVE_TAREAS = "neatnest_tareas";
const CLAVE_HORAS = "neatnest_horas";
// Marca de que ya se cargaron las tareas sugeridas alguna vez.
const CLAVE_INICIADO = "neatnest_iniciado";

// Base de cálculo: días laborables al mes (lunes a viernes ≈ 20 días)
const DIAS_LABORABLES_MES = 20;
// Semanas al mes (para "varias veces por semana")
const SEMANAS_MES = 4;

// --- Días laborables (lunes a viernes) ---
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Horas por defecto: 2h de lunes a jueves, viernes no viene
const HORAS_POR_DEFECTO = [2, 2, 2, 2, 0];

/* ------------------------------------------------------------
   Recurrencias disponibles y su texto para mostrar.
   "semanalN" = varias veces por semana (usa el campo "veces").
   ------------------------------------------------------------ */
const TEXTO_RECURRENCIA = {
  diario: "Diaria",
  semanalN: "Varias veces/semana",
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

/* ------------------------------------------------------------
   Cuántas veces al mes se hace una tarea según su recurrencia.
   Nos basamos en 20 días laborables al mes (lunes a viernes).
   Para "semanalN" se usa el número de veces por semana x 4.
   ------------------------------------------------------------ */
function vecesAlMes(tarea) {
  switch (tarea.recurrencia) {
    case "diario":
      return DIAS_LABORABLES_MES; // 20 veces/mes
    case "semanalN":
      return (tarea.veces || 1) * SEMANAS_MES; // X veces/semana x 4
    case "semanal":
      return 4;
    case "quincenal":
      return 2;
    case "mensual":
      return 1;
    default:
      return 1;
  }
}

/* ------------------------------------------------------------
   Tareas sugeridas por defecto (de la lista del hogar).
   Tiempos: valor BAJO del rango. "veces" solo aplica a semanalN.
   ------------------------------------------------------------ */
const TAREAS_SUGERIDAS = [
  // Diarias
  { nombre: "Vaciar el lavavajillas / fregar", tiempo: 10, recurrencia: "diario" },
  { nombre: "Hacer la colada (poner y tender)", tiempo: 15, recurrencia: "diario" },
  { nombre: "Limpiar cocina", tiempo: 10, recurrencia: "diario" },
  { nombre: "Recogida express casa", tiempo: 10, recurrencia: "diario" },
  { nombre: "Sacar la basura", tiempo: 5, recurrencia: "diario" },
  { nombre: "Limpiar los baños", tiempo: 10, recurrencia: "diario" },
  { nombre: "Aspirar la casa", tiempo: 15, recurrencia: "diario" },
  { nombre: "Cocinar comidas / cenas", tiempo: 30, recurrencia: "diario" },
  { nombre: "Fregar el suelo", tiempo: 15, recurrencia: "semanalN", veces: 2 },
  { nombre: "Planchar la ropa", tiempo: 30, recurrencia: "semanalN", veces: 2 },
  // Semanales
  { nombre: "Quitar el polvo", tiempo: 15, recurrencia: "semanal" },
  { nombre: "Limpiar microondas y revisar nevera", tiempo: 10, recurrencia: "semanal" },
  { nombre: "Limpiar filtro lavavajillas", tiempo: 5, recurrencia: "semanal" },
  { nombre: "Limpiar campana", tiempo: 10, recurrencia: "semanal" },
  { nombre: "Baños a fondo", tiempo: 20, recurrencia: "semanal" },
  { nombre: "Limpiar cristales y ventanas", tiempo: 30, recurrencia: "semanal" },
  // Quincenales
  { nombre: "Cambiar sábanas y toallas", tiempo: 10, recurrencia: "quincenal" },
  { nombre: "Limpiar a fondo electrodomésticos", tiempo: 30, recurrencia: "quincenal" },
  // Mensuales
  { nombre: "Limpiar puertas, interruptores y rodapiés", tiempo: 20, recurrencia: "mensual" },
  { nombre: "Aspirar sofás y colchones", tiempo: 15, recurrencia: "mensual" },
  { nombre: "Lavar cortinas, fundas y edredones", tiempo: 30, recurrencia: "mensual" },
  { nombre: "Limpiar interior de armarios cocina/baños", tiempo: 60, recurrencia: "mensual" },
];

// Crea una copia de las tareas sugeridas con id propio.
function crearTareasSugeridas() {
  return TAREAS_SUGERIDAS.map((t, i) => ({
    id: Date.now() + i,
    nombre: t.nombre,
    tiempo: t.tiempo,
    recurrencia: t.recurrencia,
    veces: t.veces || 1,
  }));
}

// --- Estado en memoria ---
let tareas = cargarTareas();
let horas = cargarHoras();

/* ============================================================
   GUARDAR Y CARGAR
   ============================================================ */
function cargarTareas() {
  const yaIniciado = localStorage.getItem(CLAVE_INICIADO);
  const datos = localStorage.getItem(CLAVE_TAREAS);

  // Primera vez que se abre: cargamos las tareas sugeridas.
  if (!yaIniciado && !datos) {
    const sugeridas = crearTareasSugeridas();
    localStorage.setItem(CLAVE_TAREAS, JSON.stringify(sugeridas));
    localStorage.setItem(CLAVE_INICIADO, "si");
    return sugeridas;
  }

  return datos ? JSON.parse(datos) : [];
}

function guardarTareas() {
  localStorage.setItem(CLAVE_TAREAS, JSON.stringify(tareas));
}

function cargarHoras() {
  const datos = localStorage.getItem(CLAVE_HORAS);
  return datos ? JSON.parse(datos) : [...HORAS_POR_DEFECTO];
}

function guardarHoras() {
  localStorage.setItem(CLAVE_HORAS, JSON.stringify(horas));
}

/* ============================================================
   FORMULARIO: añadir tarea nueva
   ============================================================ */
const form = document.getElementById("form-tarea");
const selectRecurrencia = document.getElementById("recurrencia");
const campoVeces = document.getElementById("campo-veces");

// Muestra/oculta el campo "veces por semana" según la recurrencia elegida.
function actualizarVisibilidadVeces() {
  campoVeces.style.display =
    selectRecurrencia.value === "semanalN" ? "flex" : "none";
}
selectRecurrencia.addEventListener("change", actualizarVisibilidadVeces);

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const tiempo = parseInt(document.getElementById("tiempo").value, 10);
  const recurrencia = selectRecurrencia.value;
  const veces = parseInt(document.getElementById("veces").value, 10) || 1;

  if (!nombre || !tiempo || tiempo <= 0) return;

  const editandoId = form.dataset.editando;
  if (editandoId) {
    const tarea = tareas.find((t) => t.id === Number(editandoId));
    if (tarea) {
      tarea.nombre = nombre;
      tarea.tiempo = tiempo;
      tarea.recurrencia = recurrencia;
      tarea.veces = veces;
    }
  } else {
    tareas.push({
      id: Date.now(),
      nombre: nombre,
      tiempo: tiempo,
      recurrencia: recurrencia,
      veces: veces,
    });
  }

  guardarTareas();
  pintarTareas();
  actualizarResumen();
  pintarPlanHoy();
  resetFormTarea();
});

/* ============================================================
   TAREAS: borrar, editar, restaurar, pintar
   ============================================================ */
const listaTareas = document.getElementById("lista-tareas");
const avisoVacio = document.getElementById("sin-tareas");
const botonRestaurar = document.getElementById("boton-restaurar");

function borrarTarea(id) {
  tareas = tareas.filter((t) => t.id !== id);
  guardarTareas();
  pintarTareas();
  actualizarResumen();
  pintarPlanHoy();
}

// Restaura la lista de tareas sugeridas (pide confirmación).
botonRestaurar.addEventListener("click", () => {
  const ok = confirm(
    "Esto reemplazará tus tareas actuales por la lista sugerida. ¿Seguro?"
  );
  if (!ok) return;
  tareas = crearTareasSugeridas();
  guardarTareas();
  pintarTareas();
  actualizarResumen();
  pintarPlanHoy();
});

// Guarda los cambios de una tarea editada en el sitio.
function editarTarea(id, cambios) {
  const tarea = tareas.find((t) => t.id === id);
  if (!tarea) return;
  Object.assign(tarea, cambios);
  guardarTareas();
  pintarTareas();
  actualizarResumen();
  pintarPlanHoy();
}

// Texto de recurrencia que incluye "x veces" cuando aplica.
function textoRecurrencia(tarea) {
  if (tarea.recurrencia === "semanalN") {
    return `${tarea.veces || 1}× por semana`;
  }
  return TEXTO_RECURRENCIA[tarea.recurrencia];
}

// Devuelve el HTML de la etiqueta coloreada según la recurrencia.
function etiquetaRecurrencia(tarea) {
  return `<span class="etiqueta etiqueta-${tarea.recurrencia}">${textoRecurrencia(tarea)}</span>`;
}

// Clase CSS de la barrita de color para una recurrencia.
function claseRecurrencia(tarea) {
  return "rec-" + tarea.recurrencia;
}

// Filtro y buscador de tareas.
const buscarTarea = document.getElementById("buscar-tarea");
const filtrosRec = document.getElementById("filtros-rec");
let filtroRec = "todos";
let textoBuscarTarea = "";

function pintarFiltrosTareas() {
  if (!filtrosRec) return;
  const claves = ["todos", ...Object.keys(TEXTO_RECURRENCIA)];
  filtrosRec.innerHTML = "";
  claves.forEach((clave) => {
    const btn = document.createElement("button");
    const claseColor = clave === "todos" ? "" : " filtro-rec-" + clave;
    btn.className =
      "chip-filtro" + claseColor + (clave === filtroRec ? " chip-filtro-activo" : "");
    btn.textContent = clave === "todos" ? "Todas" : TEXTO_RECURRENCIA[clave];
    btn.addEventListener("click", () => {
      filtroRec = clave;
      pintarFiltrosTareas();
      pintarTareas();
    });
    filtrosRec.appendChild(btn);
  });
}

if (buscarTarea) {
  buscarTarea.addEventListener("input", () => {
    textoBuscarTarea = buscarTarea.value.trim().toLowerCase();
    pintarTareas();
  });
}

function tareasVisibles() {
  return tareas.filter((t) => {
    const pasaRec = filtroRec === "todos" || t.recurrencia === filtroRec;
    const pasaTexto = t.nombre.toLowerCase().includes(textoBuscarTarea);
    return pasaRec && pasaTexto;
  });
}

function pintarTareas() {
  listaTareas.innerHTML = "";
  const visibles = tareasVisibles();

  if (tareas.length === 0) {
    avisoVacio.textContent = "Todavía no has añadido ninguna tarea.";
    avisoVacio.style.display = "block";
    return;
  }
  if (visibles.length === 0) {
    avisoVacio.textContent = "Ninguna tarea coincide con el filtro.";
    avisoVacio.style.display = "block";
    return;
  }
  avisoVacio.style.display = "none";

  visibles.forEach((tarea) => {
    listaTareas.appendChild(crearChipTarea(tarea));
  });
}

// Chip de una tarea (click para editar), coloreado por recurrencia.
function crearChipTarea(tarea) {
  const chip = document.createElement("button");
  chip.className = "chip-plato " + claseRecurrencia(tarea);
  chip.title = `${textoRecurrencia(tarea)} · ${tarea.tiempo} min`;
  chip.innerHTML =
    `<span class="chip-nombre">${tarea.nombre}</span>` +
    `<span class="chip-min">${tarea.tiempo}'</span>`;
  chip.addEventListener("click", () => abrirEdicionTarea(tarea));
  return chip;
}

// Abre la edición de una tarea reutilizando el formulario de añadir.
function abrirEdicionTarea(tarea) {
  zonaFormulario.style.display = "block";
  botonAnadir.textContent = "✕ Cerrar";

  document.getElementById("nombre").value = tarea.nombre;
  document.getElementById("tiempo").value = tarea.tiempo;
  selectRecurrencia.value = tarea.recurrencia;
  document.getElementById("veces").value = tarea.veces || 1;
  actualizarVisibilidadVeces();

  form.dataset.editando = tarea.id;
  document.querySelector("#form-tarea .boton-principal").textContent = "Guardar cambios";

  let btnBorrar = document.getElementById("btn-borrar-tarea-edicion");
  if (!btnBorrar) {
    btnBorrar = document.createElement("button");
    btnBorrar.type = "button";
    btnBorrar.id = "btn-borrar-tarea-edicion";
    btnBorrar.className = "boton-borrar-texto";
    btnBorrar.textContent = "🗑️ Borrar tarea";
    form.appendChild(btnBorrar);
  }
  btnBorrar.style.display = "block";
  btnBorrar.onclick = () => {
    borrarTarea(tarea.id);
    resetFormTarea();
  };

  document.getElementById("nombre").focus();
}

function resetFormTarea() {
  form.reset();
  delete form.dataset.editando;
  document.querySelector("#form-tarea .boton-principal").textContent = "Añadir tarea";
  const btnBorrar = document.getElementById("btn-borrar-tarea-edicion");
  if (btnBorrar) btnBorrar.style.display = "none";
  zonaFormulario.style.display = "none";
  botonAnadir.textContent = "+ Añadir";
  actualizarVisibilidadVeces();
}

// Crea el <li> de una tarea en modo "edición".
/* ============================================================
   PLAN DE HOY
   Reparte las tareas no diarias entre los 20 días laborables
   del mes para que no se amontonen. Las diarias salen siempre.
   El usuario puede quitar tareas solo del día de hoy.
   ============================================================ */

// Clave para recordar qué tareas se han quitado hoy (por fecha).
const CLAVE_QUITADAS = "neatnest_quitadas_hoy";
const CLAVE_INICIO_CICLO = "neatnest_inicio_ciclo"; // fecha del primer uso
const CLAVE_BACKLOG = "neatnest_backlog";           // pendientes no hechas
const CLAVE_EXTRA_HOY = "neatnest_extra_hoy";        // tareas añadidas a hoy
const CLAVE_HORAS_HOY = "neatnest_horas_hoy";        // override de horas de hoy

// Devuelve una fecha como texto "AAAA-MM-DD".
function fechaTexto(d) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
function fechaHoyTexto() {
  return fechaTexto(new Date());
}

/* ------------------------------------------------------------
   CICLO DE 20 DÍAS LABORABLES DESDE EL PRIMER USO
   Guardamos la fecha del primer uso. A partir de ahí contamos
   días laborables (lun-vie). El día 1 del ciclo es el primer uso.
   El ciclo dura 20 días laborables y luego se reinicia.
   ------------------------------------------------------------ */
function obtenerInicioCiclo() {
  let guardada = localStorage.getItem(CLAVE_INICIO_CICLO);
  if (!guardada) {
    guardada = fechaHoyTexto();
    localStorage.setItem(CLAVE_INICIO_CICLO, guardada);
  }
  return new Date(guardada + "T00:00:00");
}

// Cuenta días laborables (lun-vie) entre dos fechas, ambas incluidas.
function diasLaborablesEntre(desde, hasta) {
  let cuenta = 0;
  const d = new Date(desde);
  d.setHours(0, 0, 0, 0);
  const fin = new Date(hasta);
  fin.setHours(0, 0, 0, 0);
  while (d <= fin) {
    const ds = d.getDay();
    if (ds !== 0 && ds !== 6) cuenta++;
    d.setDate(d.getDate() + 1);
  }
  return cuenta;
}

// Índice (1..20) dentro del menú/calendario para una fecha dada.
// Se basa en el día de la semana REAL y en la semana del mes:
//   indice = (semanaDelMes - 1) * 5 + diaLaborable
// Lunes=1 ... Viernes=5. Devuelve 0 si es fin de semana.
function indiceCalendarioEnFecha(fecha) {
  const ds = fecha.getDay(); // 0=domingo .. 6=sábado
  if (ds === 0 || ds === 6) return 0;
  const diaLaborable = ds; // lunes(1)..viernes(5) coinciden con getDay()

  // Semana del mes (1..4). Usamos el día del mes: 1-7 -> 1, 8-14 -> 2, etc.
  // La limitamos a 4 para encajar en el menú de 4 semanas.
  let semanaMes = Math.floor((fecha.getDate() - 1) / 7) + 1;
  if (semanaMes > 4) semanaMes = 4; // los días del 29-31 usan la semana 4

  return (semanaMes - 1) * 5 + diaLaborable;
}

// Índice de hoy (1..20); 0 si es fin de semana.
function numeroDiaDelCiclo() {
  return indiceCalendarioEnFecha(new Date());
}

/* ------------------------------------------------------------
   CALENDARIO DEL CICLO: asigna cada ocurrencia de cada tarea
   a un día laborable (1..20), GARANTIZANDO que todas aparecen.
   Devuelve un objeto { dia: [tareas...] }.
   ------------------------------------------------------------ */
function construirCalendarioCiclo() {
  const calendario = {};
  for (let d = 1; d <= DIAS_LABORABLES_MES; d++) calendario[d] = [];

  // Carga de minutos ya asignada a cada día (para equilibrar).
  const cargaDia = {};
  for (let d = 1; d <= DIAS_LABORABLES_MES; d++) cargaDia[d] = 0;

  // 1) Las diarias van en todos los días.
  const diarias = tareas.filter((t) => t.recurrencia === "diario");
  diarias.forEach((t) => {
    for (let d = 1; d <= DIAS_LABORABLES_MES; d++) {
      calendario[d].push(t);
      cargaDia[d] += t.tiempo;
    }
  });

  // 2) Las no diarias: repartimos sus ocurrencias en días separados,
  //    eligiendo cada vez el día MENOS cargado y aún no usado por ella.
  const noDiarias = tareas.filter((t) => t.recurrencia !== "diario");
  noDiarias.forEach((t) => {
    const ocurrencias = Math.min(vecesAlMes(t), DIAS_LABORABLES_MES);
    const diasUsados = new Set();

    for (let k = 0; k < ocurrencias; k++) {
      // Separación ideal entre ocurrencias para no amontonar.
      const paso = DIAS_LABORABLES_MES / ocurrencias;
      const diaIdeal = Math.floor(k * paso) + 1;

      // Buscamos, cerca del día ideal, el día libre con menos carga.
      let mejorDia = -1;
      let mejorCarga = Infinity;
      for (let i = 0; i < DIAS_LABORABLES_MES; i++) {
        const dia = ((diaIdeal - 1 + i) % DIAS_LABORABLES_MES) + 1;
        if (diasUsados.has(dia)) continue;
        if (cargaDia[dia] < mejorCarga) {
          mejorCarga = cargaDia[dia];
          mejorDia = dia;
        }
      }
      if (mejorDia === -1) break; // todos usados (no debería pasar)

      calendario[mejorDia].push(t);
      cargaDia[mejorDia] += t.tiempo;
      diasUsados.add(mejorDia);
    }
  });

  return calendario;
}

// Tareas teóricas de hoy = las del día del ciclo + las añadidas a mano.
function tareasTeoricasHoy() {
  const diaCiclo = numeroDiaDelCiclo();
  if (diaCiclo === 0) return []; // fin de semana

  const calendario = construirCalendarioCiclo();
  const delDia = calendario[diaCiclo] || [];

  // Añadimos las que el usuario metió a mano desde el backlog.
  const extras = cargarExtraHoy();
  const extrasTareas = extras
    .map((id) => tareas.find((t) => t.id === id))
    .filter(Boolean);

  // Evitamos duplicados.
  const vistos = new Set(delDia.map((t) => t.id));
  extrasTareas.forEach((t) => {
    if (!vistos.has(t.id)) {
      delDia.push(t);
      vistos.add(t.id);
    }
  });

  return delDia;
}

/* ------------------------------------------------------------
   ESTADO DIARIO: quitadas de hoy, extras de hoy, backlog.
   "quitadas" y "extras" se asocian a la fecha de hoy; si cambia
   el día, se reinician. El backlog persiste entre días.
   ------------------------------------------------------------ */
function cargarListaDeHoy(clave) {
  const datos = localStorage.getItem(clave);
  if (!datos) return [];
  const obj = JSON.parse(datos);
  if (obj.fecha !== fechaHoyTexto()) return [];
  return obj.ids;
}
function guardarListaDeHoy(clave, ids) {
  localStorage.setItem(clave, JSON.stringify({ fecha: fechaHoyTexto(), ids }));
}

function cargarQuitadasHoy() {
  return cargarListaDeHoy(CLAVE_QUITADAS);
}
function guardarQuitadasHoy(ids) {
  guardarListaDeHoy(CLAVE_QUITADAS, ids);
}
function cargarExtraHoy() {
  return cargarListaDeHoy(CLAVE_EXTRA_HOY);
}
function guardarExtraHoy(ids) {
  guardarListaDeHoy(CLAVE_EXTRA_HOY, ids);
}

// Backlog: lista de ids de tareas no diarias pendientes (persiste).
function cargarBacklog() {
  const datos = localStorage.getItem(CLAVE_BACKLOG);
  return datos ? JSON.parse(datos) : [];
}
function guardarBacklog(ids) {
  localStorage.setItem(CLAVE_BACKLOG, JSON.stringify(ids));
}

let quitadasHoy = cargarQuitadasHoy();
let extraHoy = cargarExtraHoy();
let backlog = cargarBacklog();

/* ------------------------------------------------------------
   HORAS DISPONIBLES DE HOY (editable solo para hoy).
   Si no hay override, se usa el plan semanal por defecto.
   ------------------------------------------------------------ */
function diaSemanaIndice() {
  const ds = new Date().getDay(); // 0=domingo..6=sábado
  if (ds === 0 || ds === 6) return -1;
  return ds - 1; // lunes(1)->0 ... viernes(5)->4
}

function horasPorDefectoHoy() {
  const i = diaSemanaIndice();
  return i >= 0 ? horas[i] : 0;
}

function horasDeHoy() {
  const datos = localStorage.getItem(CLAVE_HORAS_HOY);
  if (datos) {
    const obj = JSON.parse(datos);
    if (obj.fecha === fechaHoyTexto()) return obj.valor;
  }
  return horasPorDefectoHoy();
}

function guardarHorasDeHoy(valor) {
  localStorage.setItem(
    CLAVE_HORAS_HOY,
    JSON.stringify({ fecha: fechaHoyTexto(), valor })
  );
}

const NOMBRE_DIAS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

/* ============================================================
   PINTAR EL PLAN DE HOY
   ============================================================ */
const listaPlan = document.getElementById("lista-plan");
const avisoPlan = document.getElementById("plan-vacio");
const resumenPlan = document.getElementById("resumen-plan");
const cajaHorasHoy = document.getElementById("horas-hoy");
const listaBacklog = document.getElementById("lista-backlog");
const avisoBacklog = document.getElementById("backlog-vacio");

function pintarHorasHoy() {
  const hoy = new Date();
  const nombreDia = NOMBRE_DIAS[hoy.getDay()];
  const esFinde = diaSemanaIndice() === -1;

  if (esFinde) {
    cajaHorasHoy.innerHTML = `<span>Hoy es <strong>${nombreDia}</strong>. La empleada no viene. 🎉</span>`;
    return;
  }

  cajaHorasHoy.innerHTML = `
    <span>Hoy es <strong>${nombreDia}</strong>. Horas disponibles hoy:</span>
    <span class="horas-hoy-control">
      <input type="number" id="input-horas-hoy" min="0" step="0.5" value="${horasDeHoy()}" />
      <span>h</span>
    </span>
  `;

  const input = document.getElementById("input-horas-hoy");
  input.addEventListener("input", () => {
    const valor = parseFloat(input.value) || 0;
    guardarHorasDeHoy(valor);
    pintarResumenPlan(tareasTeoricasHoy());
  });
}

// Crea el <li> de una tarea del plan de hoy (con su botón quitar/recuperar).
function crearFilaPlan(tarea) {
  const quitada = quitadasHoy.includes(tarea.id);

  const li = document.createElement("li");
  li.className =
    "item-plan " + claseRecurrencia(tarea) + (quitada ? " item-plan-quitada" : "");

  const info = document.createElement("div");
  info.className = "item-info";

  const nombre = document.createElement("span");
  nombre.className = "item-nombre";
  nombre.textContent = tarea.nombre;

  const detalle = document.createElement("span");
  detalle.className = "item-detalle";
  detalle.innerHTML = `${tarea.tiempo} min · ` + etiquetaRecurrencia(tarea);

  info.appendChild(nombre);
  info.appendChild(detalle);

  const boton = document.createElement("button");
  if (quitada) {
    boton.className = "boton-secundario";
    boton.textContent = "↩ Recuperar";
    boton.addEventListener("click", () => recuperarDeHoy(tarea.id));
  } else {
    boton.className = "boton-quitar";
    boton.textContent = "Quitar de hoy";
    boton.addEventListener("click", () => quitarDeHoy(tarea));
  }

  li.appendChild(info);
  li.appendChild(boton);
  return li;
}

// Nº de día del menú para una fecha dada (1..20); 0 si finde.
// Usa la misma lógica basada en día de la semana y semana del mes.
function numeroDiaDelCicloEnFecha(fecha) {
  return indiceCalendarioEnFecha(fecha);
}

// Comida y cena del menú guardado para un día del ciclo (1..20).
function menuEnDiaCiclo(diaCiclo) {
  if (!diaCiclo || diaCiclo === 0) return null;
  const datos = localStorage.getItem("neatnest_menu");
  if (!datos) return null;
  const menu = JSON.parse(datos);
  return menu[diaCiclo - 1] || null;
}

// Menú de hoy.
function menuDeHoy() {
  return menuEnDiaCiclo(numeroDiaDelCiclo());
}

// Menú de mañana (null si mañana no es día laborable o no hay menú).
function menuDeManana() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return menuEnDiaCiclo(numeroDiaDelCicloEnFecha(manana));
}

// Texto "Comida: X. Cena: Y" de una entrada de menú.
function textoComidaCena(dia) {
  if (!dia) return "";
  const comida =
    (dia.comida || []).map(nombrePlatoMenu).filter(Boolean).join(" + ") || "nada";
  const cena = nombrePlatoMenu(dia.cena) || "nada";
  return `Comida: ${comida}. Cena: ${cena}`;
}

// Texto llano de un plato del menú (tolera formato antiguo).
function nombrePlatoMenu(plato) {
  if (!plato) return "";
  if (typeof plato === "string") return plato;
  return plato.nombre || "";
}

const cajaMenuHoy = document.getElementById("menu-hoy");

/* ------------------------------------------------------------
   PLATOS A ENCARGAR: checkboxes del menú de hoy y mañana.
   Se guardan por fecha de hoy. Cada plato se identifica por una
   clave: "tramo|tipo|nombre"  (tramo = hoy|manana, tipo = comida|cena).
   ------------------------------------------------------------ */
const CLAVE_ENCARGOS = "neatnest_encargos";

function cargarEncargos() {
  const datos = localStorage.getItem(CLAVE_ENCARGOS);
  if (!datos) return [];
  const obj = JSON.parse(datos);
  if (obj.fecha !== fechaHoyTexto()) return []; // nuevo día: se reinicia
  return obj.claves;
}
function guardarEncargos(claves) {
  localStorage.setItem(
    CLAVE_ENCARGOS,
    JSON.stringify({ fecha: fechaHoyTexto(), claves })
  );
}
let encargos = cargarEncargos();

function estaEncargado(clave) {
  return encargos.includes(clave);
}
function alternarEncargo(clave, marcado) {
  if (marcado && !encargos.includes(clave)) encargos.push(clave);
  if (!marcado) encargos = encargos.filter((c) => c !== clave);
  guardarEncargos(encargos);
}

// Devuelve los platos (nombres) marcados para encargar en un tramo.
function platosEncargados(tramo) {
  const dia = tramo === "hoy" ? menuDeHoy() : menuDeManana();
  if (!dia) return [];
  const nombres = [];
  (dia.comida || []).forEach((p) => {
    const n = nombrePlatoMenu(p);
    if (n && estaEncargado(`${tramo}|comida|${n}`)) nombres.push(n);
  });
  const cenaN = nombrePlatoMenu(dia.cena);
  if (cenaN && estaEncargado(`${tramo}|cena|${cenaN}`)) nombres.push(cenaN);
  return nombres;
}

// Pinta un bloque de menú (hoy o mañana) con checkboxes por plato.
function bloqueMenuHTML(dia, tramo, titulo) {
  if (!dia) return "";
  const filas = [];

  const addFila = (tipo, etiqueta, plato) => {
    const n = nombrePlatoMenu(plato);
    if (!n) return;
    const clave = `${tramo}|${tipo}|${n}`;
    const chk = estaEncargado(clave) ? "checked" : "";
    filas.push(
      `<label class="menu-hoy-linea menu-check-linea">
        <input type="checkbox" class="menu-check" data-clave="${clave}" ${chk} />
        <span class="menu-hoy-et">${etiqueta}</span>
        <span class="menu-plato-nombre">${n}</span>
      </label>`
    );
  };

  (dia.comida || []).forEach((p) => addFila("comida", "Comida", p));
  addFila("cena", "Cena", dia.cena);

  return `<div class="menu-hoy-titulo">${titulo}</div>${filas.join("")}`;
}

function pintarMenuHoy() {
  const hoy = menuDeHoy();
  const manana = menuDeManana();

  if (!hoy && !manana) {
    cajaMenuHoy.innerHTML = "";
    return;
  }

  let html = "";
  html += bloqueMenuHTML(hoy, "hoy", "🍽️ Menú de hoy");
  if (manana) {
    html += `<div class="menu-hoy-sep"></div>`;
    html += bloqueMenuHTML(manana, "manana", "🗓️ Menú de mañana");
  }
  html += `<div class="menu-hoy-ayuda">Marca lo que haya que encargar cocinar; se incluirá en el mensaje.</div>`;
  cajaMenuHoy.innerHTML = html;

  // Enlazar checkboxes.
  cajaMenuHoy.querySelectorAll(".menu-check").forEach((chk) => {
    chk.addEventListener("change", () => {
      alternarEncargo(chk.dataset.clave, chk.checked);
    });
  });
}

function pintarPlanHoy() {
  pintarHorasHoy();
  pintarMenuHoy();

  const teoricas = tareasTeoricasHoy();
  listaPlan.innerHTML = "";

  if (teoricas.length === 0) {
    avisoPlan.style.display = "block";
    avisoPlan.textContent =
      numeroDiaDelCiclo() === 0
        ? "Hoy es fin de semana: la empleada no viene. ¡Descanso! 🎉"
        : "No hay tareas para hoy.";
    resumenPlan.innerHTML = "";
    pintarBacklog();
    return;
  }
  avisoPlan.style.display = "none";

  // Separamos diarias (caja plegable) de no diarias (lista normal).
  const diarias = teoricas.filter((t) => t.recurrencia === "diario");
  const noDiarias = teoricas.filter((t) => t.recurrencia !== "diario");

  // --- Cajita compacta con las diarias (bullets pequeños, visible) ---
  if (diarias.length > 0) {
    const activas = diarias.filter((t) => !quitadasHoy.includes(t.id));
    const minutos = activas.reduce((s, t) => s + t.tiempo, 0);

    const caja = document.createElement("li");
    caja.className = "item-caja caja-diarias rec-diario";

    const titulo = document.createElement("div");
    titulo.className = "diarias-titulo";
    titulo.innerHTML =
      `<span>🔵 Tareas diarias</span>` +
      `<span class="diarias-tiempo">${formatearHoras(minutos / 60)}</span>`;
    caja.appendChild(titulo);

    const ul = document.createElement("ul");
    ul.className = "bullets-diarias";

    diarias.forEach((tarea) => {
      const quitada = quitadasHoy.includes(tarea.id);
      const li = document.createElement("li");
      li.className = "bullet-diaria" + (quitada ? " bullet-quitada" : "");

      const texto = document.createElement("span");
      texto.textContent = `${tarea.nombre} (${tarea.tiempo} min)`;

      // Botón pequeño para quitar/recuperar la diaria de hoy.
      const boton = document.createElement("button");
      boton.className = "bullet-x";
      if (quitada) {
        boton.textContent = "↩";
        boton.title = "Recuperar";
        boton.addEventListener("click", () => recuperarDeHoy(tarea.id));
      } else {
        boton.textContent = "×";
        boton.title = "Quitar de hoy";
        boton.addEventListener("click", () => quitarDeHoy(tarea));
      }

      li.appendChild(texto);
      li.appendChild(boton);
      ul.appendChild(li);
    });

    caja.appendChild(ul);
    listaPlan.appendChild(caja);
  }

  // --- Lista normal con las no diarias ---
  noDiarias.forEach((tarea) => {
    listaPlan.appendChild(crearFilaPlan(tarea));
  });

  pintarResumenPlan(teoricas);
  pintarBacklog();
}

function quitarDeHoy(tarea) {
  if (!quitadasHoy.includes(tarea.id)) quitadasHoy.push(tarea.id);
  guardarQuitadasHoy(quitadasHoy);

  // Si era una tarea añadida a mano, la sacamos de los extras.
  extraHoy = extraHoy.filter((x) => x !== tarea.id);
  guardarExtraHoy(extraHoy);

  // Solo las NO diarias van al backlog de pendientes.
  if (tarea.recurrencia !== "diario" && !backlog.includes(tarea.id)) {
    backlog.push(tarea.id);
    guardarBacklog(backlog);
  }

  pintarPlanHoy();
}

function recuperarDeHoy(id) {
  quitadasHoy = quitadasHoy.filter((x) => x !== id);
  guardarQuitadasHoy(quitadasHoy);

  // Al recuperarla, ya no está pendiente: fuera del backlog.
  backlog = backlog.filter((x) => x !== id);
  guardarBacklog(backlog);

  pintarPlanHoy();
}

// Resumen del plan: minutos de hoy vs. horas disponibles hoy.
function pintarResumenPlan(teoricas) {
  const activas = teoricas.filter((t) => !quitadasHoy.includes(t.id));
  const minutosActivos = activas.reduce((s, t) => s + t.tiempo, 0);

  const horasHoy = horasDeHoy();
  const minutosHoy = horasHoy * 60;

  const cabe = minutosActivos <= minutosHoy;
  const mensaje = cabe
    ? `<span class="mensaje-ok">✅ Cabe en las ${formatearHoras(horasHoy)} de hoy.</span>`
    : `<span class="mensaje-aviso">⚠️ Te pasas por ${formatearHoras((minutosActivos - minutosHoy) / 60)}. Quita alguna tarea.</span>`;

  resumenPlan.innerHTML = `
    <div class="linea-resumen">
      <span>Tiempo del plan de hoy</span>
      <strong>${formatearHoras(minutosActivos / 60)}</strong>
    </div>
    <div class="linea-resumen">
      <span>Horas disponibles hoy</span>
      <strong>${formatearHoras(horasHoy)}</strong>
    </div>
    <hr style="border:none;border-top:1px solid #d4e8c8;margin:4px 0;" />
    <div class="linea-resumen">${mensaje}</div>
  `;
}

/* ============================================================
   COMPARTIR LA LISTA CON LA EMPLEADA (WhatsApp / copiar)
   Mensaje sin tiempos, solo los nombres de las tareas activas.
   ============================================================ */
const botonCopiar = document.getElementById("boton-copiar");
const botonWhatsapp = document.getElementById("boton-whatsapp");
const avisoCopiado = document.getElementById("aviso-copiado");

// Construye el texto del mensaje para la empleada.
// Las diarias NO se listan (se dan por entendidas); se detalla el resto.
// El menú de hoy siempre aparece; el de mañana solo si es laborable.
function construirMensajeCompartir() {
  const teoricas = tareasTeoricasHoy();
  const activas = teoricas.filter((t) => !quitadasHoy.includes(t.id));

  // Tareas NO diarias en una sola lista (sin mostrar la recurrencia:
  // a la empleada no le interesa si es semanal, quincenal, etc.).
  const noDiarias = activas.filter((t) => t.recurrencia !== "diario");
  const cuerpoTareas =
    noDiarias.length > 0
      ? noDiarias.map((t) => `- ${t.nombre}`).join("\n")
      : "(hoy solo las tareas diarias)";

  // Platos marcados para encargar (hoy y mañana).
  const encHoy = platosEncargados("hoy");
  const encManana = platosEncargados("manana");

  const partesCocina = [];
  if (encHoy.length > 0) {
    partesCocina.push("Para cocinar hoy: " + encHoy.join(", ") + ".");
  }
  if (encManana.length > 0) {
    partesCocina.push("Para dejar preparado para mañana: " + encManana.join(", ") + ".");
  }

  let mensaje =
    "Hola, comparto contigo la lista de tareas que me gustaría priorizar para hoy, además de las diarias:\n\n" +
    cuerpoTareas;

  if (partesCocina.length > 0) {
    mensaje += "\n\nAdemás, en cocina:\n" + partesCocina.join("\n");
  }

  mensaje += "\n\nMuchas gracias.";
  return mensaje;
}

// Copiar al portapapeles.
botonCopiar.addEventListener("click", async () => {
  const texto = construirMensajeCompartir();
  try {
    await navigator.clipboard.writeText(texto);
    mostrarCopiado();
  } catch (e) {
    // Si el navegador no deja usar el portapapeles, mostramos el texto.
    window.prompt("Copia el texto manualmente (Ctrl+C):", texto);
  }
});

function mostrarCopiado() {
  avisoCopiado.style.display = "inline";
  setTimeout(() => {
    avisoCopiado.style.display = "none";
  }, 2000);
}

// Abrir WhatsApp con el mensaje ya escrito.
botonWhatsapp.addEventListener("click", () => {
  const texto = construirMensajeCompartir();
  const url = "https://wa.me/?text=" + encodeURIComponent(texto);
  window.open(url, "_blank");
});

/* ============================================================
   BACKLOG (pendientes): tareas no diarias que se quitaron.
   Acciones por tarea: hecha, añadir a hoy, eliminar.
   ============================================================ */
function pintarBacklog() {
  // Limpiamos del backlog ids de tareas que ya no existen.
  backlog = backlog.filter((id) => tareas.some((t) => t.id === id));
  guardarBacklog(backlog);

  listaBacklog.innerHTML = "";

  if (backlog.length === 0) {
    avisoBacklog.style.display = "block";
    return;
  }
  avisoBacklog.style.display = "none";

  backlog.forEach((id) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;

    const li = document.createElement("li");
    li.className = "item-backlog " + claseRecurrencia(tarea);

    const info = document.createElement("div");
    info.className = "item-info";

    const nombre = document.createElement("span");
    nombre.className = "item-nombre";
    nombre.textContent = tarea.nombre;

    const detalle = document.createElement("span");
    detalle.className = "item-detalle";
    detalle.innerHTML = `${tarea.tiempo} min · ` + etiquetaRecurrencia(tarea);

    info.appendChild(nombre);
    info.appendChild(detalle);

    const acciones = document.createElement("div");
    acciones.className = "item-acciones";

    const btnHecha = document.createElement("button");
    btnHecha.className = "boton-editar";
    btnHecha.textContent = "✔️";
    btnHecha.title = "Marcar como hecha";
    btnHecha.addEventListener("click", () => backlogHecha(id));

    const btnHoy = document.createElement("button");
    btnHoy.className = "boton-editar";
    btnHoy.textContent = "➕";
    btnHoy.title = "Añadir al plan de hoy";
    btnHoy.addEventListener("click", () => backlogAHoy(id));

    const btnBorrar = document.createElement("button");
    btnBorrar.className = "boton-borrar";
    btnBorrar.textContent = "🗑️";
    btnBorrar.title = "Eliminar del backlog";
    btnBorrar.addEventListener("click", () => backlogEliminar(id));

    acciones.appendChild(btnHecha);
    acciones.appendChild(btnHoy);
    acciones.appendChild(btnBorrar);

    li.appendChild(info);
    li.appendChild(acciones);
    listaBacklog.appendChild(li);
  });
}

// Marcar hecha: sale del backlog (y del "quitadas" por si acaso).
function backlogHecha(id) {
  backlog = backlog.filter((x) => x !== id);
  guardarBacklog(backlog);
  pintarPlanHoy();
}

// Añadir a hoy: entra en el plan de hoy y sale del backlog.
function backlogAHoy(id) {
  if (!extraHoy.includes(id)) extraHoy.push(id);
  guardarExtraHoy(extraHoy);

  // Deja de estar "quitada" hoy y sale del backlog.
  quitadasHoy = quitadasHoy.filter((x) => x !== id);
  guardarQuitadasHoy(quitadasHoy);
  backlog = backlog.filter((x) => x !== id);
  guardarBacklog(backlog);

  pintarPlanHoy();
}

// Eliminar: lo descarta del backlog sin más.
function backlogEliminar(id) {
  backlog = backlog.filter((x) => x !== id);
  guardarBacklog(backlog);
  pintarBacklog();
}

/* ============================================================
   HORAS DISPONIBLES: pintar la fila de inputs
   ============================================================ */
const filaHoras = document.getElementById("fila-horas");

function pintarHoras() {
  filaHoras.innerHTML = "";

  DIAS.forEach((dia, indice) => {
    const celda = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.5";
    input.value = horas[indice];
    input.setAttribute("aria-label", `Horas del ${dia}`);

    input.addEventListener("input", () => {
      horas[indice] = parseFloat(input.value) || 0;
      guardarHoras();
      actualizarResumen();
      pintarPlanHoy();
    });

    celda.appendChild(input);
    filaHoras.appendChild(celda);
  });
}

/* ============================================================
   RESUMEN DEL MES: horas disponibles vs. trabajo necesario
   ============================================================ */
const resumen = document.getElementById("resumen");

function actualizarResumen() {
  if (!resumen) return; // el resumen mensual se ha quitado de la interfaz
  // Horas disponibles al mes.
  // Media de horas por día laborable (lun-vie) x 20 días laborables al mes.
  const horasSemana = horas.reduce((suma, h) => suma + h, 0);
  const horasPorDiaLaborable = horasSemana / DIAS.length;
  const horasMes = horasPorDiaLaborable * DIAS_LABORABLES_MES;

  // Trabajo necesario al mes (en minutos -> horas)
  let minutosMes = 0;
  tareas.forEach((tarea) => {
    minutosMes += tarea.tiempo * vecesAlMes(tarea);
  });
  const horasTrabajoMes = minutosMes / 60;

  const diferencia = horasMes - horasTrabajoMes;

  let mensaje;
  if (tareas.length === 0) {
    mensaje = `<span>Añade tareas para ver si caben en el tiempo disponible.</span>`;
  } else if (diferencia >= 0) {
    mensaje = `<span class="mensaje-ok">✅ Las tareas caben. Te sobran ${formatearHoras(diferencia)} al mes.</span>`;
  } else {
    mensaje = `<span class="mensaje-aviso">⚠️ Te faltan ${formatearHoras(Math.abs(diferencia))} al mes. Quizá convenga reducir o repartir tareas.</span>`;
  }

  resumen.innerHTML = `
    <div class="linea-resumen">
      <span>Horas disponibles al mes</span>
      <strong>${formatearHoras(horasMes)}</strong>
    </div>
    <div class="linea-resumen">
      <span>Trabajo necesario al mes</span>
      <strong>${formatearHoras(horasTrabajoMes)}</strong>
    </div>
    <hr style="border:none;border-top:1px solid #d4e8c8;margin:4px 0;" />
    <div class="linea-resumen">${mensaje}</div>
  `;
}

// Convierte un número de horas (ej. 2.5) en texto "2 h 30 min"
function formatearHoras(valorHoras) {
  const totalMin = Math.round(valorHoras * 60);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h} h`;
  return `${h} h ${min} min`;
}

/* ============================================================
   PESTAÑAS (solo se ven en móvil)
   ============================================================ */
// (Las pestañas internas móviles se retiraron: el plan tiene su propia vista.)

/* ============================================================
   FORMULARIO DE AÑADIR: mostrar/ocultar con el botón "+"
   ============================================================ */
const botonAnadir = document.getElementById("boton-anadir");
const zonaFormulario = document.getElementById("zona-formulario");

botonAnadir.addEventListener("click", () => {
  const visible = zonaFormulario.style.display === "block";
  if (visible) {
    resetFormTarea();
  } else {
    resetFormTarea();
    zonaFormulario.style.display = "block";
    botonAnadir.textContent = "✕ Cerrar";
    document.getElementById("nombre").focus();
  }
});

/* ============================================================
   ARRANQUE
   ============================================================ */
actualizarVisibilidadVeces();
pintarFiltrosTareas();
pintarTareas();
pintarHoras();
actualizarResumen();
pintarPlanHoy();

/* ============================================================
   ============================================================
   MÓDULO DE MENÚS (comidas y cenas)
   ============================================================
   ============================================================ */

const CLAVE_PLATOS = "neatnest_platos";
const CLAVE_PLATOS_INIC = "neatnest_platos_iniciado";
const CLAVE_MENU = "neatnest_menu";

const CATEGORIAS = {
  primero: "Primero",
  segundo: "Segundo",
  unico: "Plato único",
  cena: "Cena",
};

// Ingrediente principal (uno por plato) con su color y emoji.
const INGREDIENTES = {
  carne: { nombre: "Carne", color: "#c0392b", emoji: "🥩" },
  pescado: { nombre: "Pescado", color: "#2980b9", emoji: "🐟" },
  huevo: { nombre: "Huevo", color: "#e1a100", emoji: "🥚" },
  legumbre: { nombre: "Legumbre", color: "#8e5a2d", emoji: "🫘" },
  verdura: { nombre: "Verdura", color: "#27ae60", emoji: "🥬" },
  pastaarroz: { nombre: "Pasta/Arroz", color: "#d98c2b", emoji: "🍝" },
};



/* ------------------------------------------------------------
   Platos sugeridos de EJEMPLO (Fase A). Se sustituirán por la
   lista real cuando la usuaria la proporcione (Fase B).
   cat: array de categorías entre "primero","segundo","unico","cena".
   ------------------------------------------------------------ */
const PLATOS_SUGERIDOS = [
  { nombre: "Lentejas estofadas", cat: ["primero"], ing: "legumbre" },
  { nombre: "Alubias blancas o negrinos", cat: ["primero"], ing: "legumbre" },
  { nombre: "Pochas", cat: ["primero"], ing: "legumbre" },
  { nombre: "Guisantes con jamón", cat: ["primero", "cena"], ing: "legumbre" },
  { nombre: "Menestra", cat: ["primero"], ing: "verdura" },
  { nombre: "Pisto con huevo", cat: ["primero", "cena"], ing: "verdura" },
  { nombre: "Berenjenas/calabacín rellenas", cat: ["unico", "cena"], ing: "verdura" },
  { nombre: "Coliflor", cat: ["primero"], ing: "verdura" },
  { nombre: "Repollo/Berza", cat: ["primero", "cena"], ing: "verdura" },
  { nombre: "Brócoli", cat: ["primero"], ing: "verdura" },
  { nombre: "Judías verdes", cat: ["primero"], ing: "verdura" },
  { nombre: "Crema de calabaza", cat: ["primero", "cena"], ing: "verdura" },
  { nombre: "Crema de pimientos asados y zanahoria", cat: ["primero", "cena"], ing: "verdura" },
  { nombre: "Vichyssoise", cat: ["primero", "cena"], ing: "verdura" },
  { nombre: "Puré de verduras", cat: ["primero", "cena"], ing: "verdura" },
  { nombre: "Arroz con verduras, setas", cat: ["primero"], ing: "pastaarroz" },
  { nombre: "Pasta con tomate y carne", cat: ["unico"], ing: "pastaarroz" },
  { nombre: "Arroz con huevos", cat: ["unico"], ing: "pastaarroz" },
  { nombre: "Garbanzos con verduras/cocido", cat: ["primero"], ing: "legumbre" },
  { nombre: "Merluza al vapor/horno", cat: ["segundo", "cena"], ing: "pescado" },
  { nombre: "Pollo a la plancha", cat: ["segundo", "cena"], ing: "carne" },
  { nombre: "Lomo adobado a la plancha", cat: ["segundo", "cena"], ing: "carne" },
  { nombre: "Filete ternera a la plancha", cat: ["segundo", "cena"], ing: "carne" },
  { nombre: "Pimientos rellenos", cat: ["unico"], ing: "carne" },
  { nombre: "Hamburguesa a la plancha", cat: ["segundo", "cena"], ing: "carne" },
  { nombre: "Tortilla de patata", cat: ["cena"], ing: "huevo" },
  { nombre: "Salmón al horno/vapor", cat: ["segundo", "cena"], ing: "pescado" },
  { nombre: "Calamares/chipirones", cat: ["segundo", "cena"], ing: "pescado" },
  { nombre: "Anchoas", cat: ["segundo", "cena"], ing: "pescado" },
  { nombre: "Tortilla de calabacín", cat: ["cena"], ing: "huevo" },
  { nombre: "Fritos de jamón y queso/croquetas caseras", cat: ["cena"], ing: "pastaarroz" },
  { nombre: "Nuggets caseras", cat: ["cena"], ing: "pastaarroz" },
  { nombre: "Albóndigas con arroz", cat: ["unico"], ing: "carne" },
  { nombre: "Revuelto de setas", cat: ["cena"], ing: "huevo" },
  { nombre: "Sopa de fideos/caldo", cat: ["primero", "cena"], ing: "pastaarroz" },
  { nombre: "Pizza casera", cat: ["cena"], ing: "pastaarroz" },
  { nombre: "Fajitas caseras", cat: ["cena"], ing: "carne" },
  { nombre: "Guiso de ternera", cat: ["segundo"], ing: "carne" },
  { nombre: "Pavo en salsa de verduras", cat: ["segundo"], ing: "carne" },
  { nombre: "Solomillo de cerdo en salsa manzana", cat: ["segundo"], ing: "carne" },
  { nombre: "Pastel de carne", cat: ["unico"], ing: "carne" },
];

/* ------------------------------------------------------------
   Verdura de temporada por mes (0=enero .. 11=diciembre).
   Lista simplificada para España. Se usa para sugerir platos.
   ------------------------------------------------------------ */
const VERDURA_TEMPORADA = [
  ["Acelga", "Alcachofa", "Brócoli", "Col", "Puerro"],      // enero
  ["Alcachofa", "Espinaca", "Guisante", "Puerro", "Zanahoria"], // febrero
  ["Acelga", "Espárrago", "Guisante", "Rábano", "Zanahoria"],   // marzo
  ["Espárrago", "Guisante", "Haba", "Lechuga", "Zanahoria"],    // abril
  ["Ajo tierno", "Espárrago", "Haba", "Pepino", "Pimiento"],    // mayo
  ["Calabacín", "Judía verde", "Pepino", "Pimiento", "Tomate"], // junio
  ["Berenjena", "Calabacín", "Pimiento", "Pepino", "Tomate"],   // julio
  ["Berenjena", "Calabacín", "Pimiento", "Tomate", "Judía verde"], // agosto
  ["Berenjena", "Calabaza", "Pimiento", "Tomate", "Zanahoria"], // septiembre
  ["Calabaza", "Col", "Espinaca", "Seta", "Zanahoria"],         // octubre
  ["Acelga", "Brócoli", "Calabaza", "Col", "Seta"],             // noviembre
  ["Acelga", "Alcachofa", "Brócoli", "Cardo", "Col"],           // diciembre
];

const NOMBRE_MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function crearPlatosSugeridos() {
  return PLATOS_SUGERIDOS.map((p, i) => ({
    id: Date.now() + i,
    nombre: p.nombre,
    cat: [...p.cat],
    ing: p.ing || "verdura",
  }));
}

/* ------------------------------------------------------------
   MENÚ BASE DE 4 SEMANAS (fuente: menu_semanal.txt).
   Cada día: comida (uno o dos nombres) y cena (un nombre).
   Los ingredientes se resuelven buscando el nombre en los platos.
   ------------------------------------------------------------ */
const MENU_BASE = [
  // Semana 1
  { comida: ["Lentejas estofadas", "Filete ternera a la plancha"], cena: "Tortilla de calabacín" },
  { comida: ["Menestra", "Merluza al vapor/horno"], cena: "Pizza casera" },
  { comida: ["Crema de calabaza", "Pollo a la plancha"], cena: "Revuelto de setas" },
  { comida: ["Garbanzos con verduras/cocido", "Salmón al horno/vapor"], cena: "Fritos de jamón y queso/croquetas caseras" },
  { comida: ["Pasta con tomate y carne"], cena: "Pisto con huevo" },
  // Semana 2
  { comida: ["Pochas", "Lomo adobado a la plancha"], cena: "Crema de pimientos asados y zanahoria" },
  { comida: ["Brócoli", "Calamares/chipirones"], cena: "Sopa de fideos/caldo" },
  { comida: ["Puré de verduras", "Hamburguesa a la plancha"], cena: "Anchoas" },
  { comida: ["Alubias blancas o negrinos", "Merluza al vapor/horno"], cena: "Tortilla de patata" },
  { comida: ["Arroz con huevos"], cena: "Nuggets caseras" },
  // Semana 3
  { comida: ["Judías verdes", "Merluza al vapor/horno"], cena: "Revuelto de setas" },
  { comida: ["Menestra", "Guiso de ternera"], cena: "Fritos de jamón y queso/croquetas caseras" },
  { comida: ["Pimientos rellenos"], cena: "Pizza casera" },
  { comida: ["Vichyssoise", "Salmón al horno/vapor"], cena: "Tortilla de patata" },
  { comida: ["Albóndigas con arroz"], cena: "Sopa de fideos/caldo" },
  // Semana 4
  { comida: ["Lentejas estofadas", "Pavo en salsa de verduras"], cena: "Tortilla de calabacín" },
  { comida: ["Menestra", "Anchoas"], cena: "Fajitas caseras" },
  { comida: ["Crema de calabaza", "Solomillo de cerdo en salsa manzana"], cena: "Nuggets caseras" },
  { comida: ["Garbanzos con verduras/cocido", "Merluza al vapor/horno"], cena: "Revuelto de setas" },
  { comida: ["Pastel de carne"], cena: "Pisto con huevo" },
];

// Busca el ingrediente de un plato por su nombre (null si no está).
function ingredientePorNombre(nombre) {
  const p = platos.find((x) => x.nombre === nombre);
  return p ? p.ing : null;
}

// Convierte el MENU_BASE en el formato interno del menú, resolviendo
// el ingrediente de cada plato desde la lista de platos.
function crearMenuBase() {
  return MENU_BASE.map((d) => ({
    comida: d.comida.map((n) => ({ nombre: n, ing: ingredientePorNombre(n) })),
    cena: d.cena ? { nombre: d.cena, ing: ingredientePorNombre(d.cena) } : null,
  }));
}



/* ------------------------------------------------------------
   CARGA Y GUARDADO DE PLATOS
   ------------------------------------------------------------ */
function cargarPlatos() {
  const iniciado = localStorage.getItem(CLAVE_PLATOS_INIC);
  const datos = localStorage.getItem(CLAVE_PLATOS);
  if (!iniciado && !datos) {
    const sugeridos = crearPlatosSugeridos();
    localStorage.setItem(CLAVE_PLATOS, JSON.stringify(sugeridos));
    localStorage.setItem(CLAVE_PLATOS_INIC, "si");
    return sugeridos;
  }
  return datos ? JSON.parse(datos) : [];
}
function guardarPlatos() {
  localStorage.setItem(CLAVE_PLATOS, JSON.stringify(platos));
}

let platos = cargarPlatos();

/* ------------------------------------------------------------
   FORMULARIO: añadir plato
   ------------------------------------------------------------ */
const formPlato = document.getElementById("form-plato");
const checksCategoria = document.querySelectorAll(
  "#form-plato .checks-categoria input"
);

formPlato.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre-plato").value.trim();
  const ing = document.getElementById("ing-plato").value;
  const cat = [];
  checksCategoria.forEach((c) => {
    if (c.checked) cat.push(c.value);
  });
  if (!nombre || cat.length === 0) {
    alert("Pon un nombre y marca al menos una categoría.");
    return;
  }

  const editandoId = formPlato.dataset.editando;
  if (editandoId) {
    // Modo edición: actualizamos el plato existente.
    const plato = platos.find((p) => p.id === Number(editandoId));
    if (plato) {
      plato.nombre = nombre;
      plato.cat = cat;
      plato.ing = ing;
    }
  } else {
    // Modo añadir.
    platos.push({ id: Date.now(), nombre, cat, ing });
  }

  guardarPlatos();
  pintarPlatos();
  resetFormPlato();
});

/* ------------------------------------------------------------
   PINTAR LISTA DE PLATOS
   ------------------------------------------------------------ */
const listaPlatos = document.getElementById("lista-platos");
const sinPlatos = document.getElementById("sin-platos");
const botonRestaurarPlatos = document.getElementById("boton-restaurar-platos");
const buscarPlato = document.getElementById("buscar-plato");
const filtrosIng = document.getElementById("filtros-ing");

// Estado del filtro (ingrediente activo) y del buscador.
let filtroIng = "todos";
let textoBuscar = "";

// Pinta los botones de filtro por ingrediente (una sola vez).
function pintarFiltros() {
  const claves = ["todos", ...Object.keys(INGREDIENTES)];
  filtrosIng.innerHTML = "";
  claves.forEach((clave) => {
    const btn = document.createElement("button");
    const claseColor = clave === "todos" ? "" : " filtro-ing-" + clave;
    btn.className =
      "chip-filtro" + claseColor + (clave === filtroIng ? " chip-filtro-activo" : "");
    if (clave === "todos") {
      btn.textContent = "Todos";
    } else {
      btn.textContent = `${INGREDIENTES[clave].emoji} ${INGREDIENTES[clave].nombre}`;
    }
    btn.addEventListener("click", () => {
      filtroIng = clave;
      pintarFiltros();
      pintarPlatos();
    });
    filtrosIng.appendChild(btn);
  });
}

buscarPlato.addEventListener("input", () => {
  textoBuscar = buscarPlato.value.trim().toLowerCase();
  pintarPlatos();
});

// Devuelve los platos que pasan el filtro y el buscador.
function platosVisibles() {
  return platos.filter((p) => {
    const pasaIng = filtroIng === "todos" || p.ing === filtroIng;
    const pasaTexto = p.nombre.toLowerCase().includes(textoBuscar);
    return pasaIng && pasaTexto;
  });
}

function pintarPlatos() {
  listaPlatos.innerHTML = "";
  const visibles = platosVisibles();

  if (platos.length === 0) {
    sinPlatos.textContent = "Todavía no has añadido ningún plato.";
    sinPlatos.style.display = "block";
    return;
  }
  if (visibles.length === 0) {
    sinPlatos.textContent = "Ningún plato coincide con el filtro.";
    sinPlatos.style.display = "block";
    return;
  }
  sinPlatos.style.display = "none";

  visibles.forEach((plato) => {
    listaPlatos.appendChild(crearChipPlato(plato));
  });
}

// Chip compacto de un plato (click para editar).
function crearChipPlato(plato) {
  const ing = INGREDIENTES[plato.ing] || INGREDIENTES.verdura;
  const chip = document.createElement("button");
  chip.className = "chip-plato ing-" + (plato.ing || "verdura");
  chip.title = `${ing.nombre} · ${plato.cat.map((c) => CATEGORIAS[c]).join(", ")}`;
  chip.innerHTML =
    `<span class="chip-punto" style="background:${ing.color}"></span>` +
    `<span class="chip-nombre">${plato.nombre}</span>`;
  chip.addEventListener("click", () => abrirEdicionPlato(plato));
  return chip;
}

/* ------------------------------------------------------------
   EDICIÓN DE PLATO (en un pequeño panel bajo la lista)
   ------------------------------------------------------------ */
function abrirEdicionPlato(plato) {
  // Reutilizamos la zona del formulario de añadir, pero en modo edición.
  const panel = document.getElementById("zona-form-plato");
  const botonAnadir = document.getElementById("boton-anadir-plato");

  document.getElementById("nombre-plato").value = plato.nombre;
  document.getElementById("ing-plato").value = plato.ing;
  checksCategoria.forEach((c) => {
    c.checked = plato.cat.includes(c.value);
  });

  panel.style.display = "block";
  document.getElementById("boton-anadir-plato").textContent = "✕ Cerrar";

  // Marcamos que estamos editando este plato.
  formPlato.dataset.editando = plato.id;
  document.querySelector("#form-plato .boton-principal").textContent = "Guardar cambios";

  // Añadimos (si no existe) un botón para borrar este plato.
  let btnBorrar = document.getElementById("btn-borrar-plato-edicion");
  if (!btnBorrar) {
    btnBorrar = document.createElement("button");
    btnBorrar.type = "button";
    btnBorrar.id = "btn-borrar-plato-edicion";
    btnBorrar.className = "boton-borrar-texto";
    btnBorrar.textContent = "🗑️ Borrar plato";
    formPlato.appendChild(btnBorrar);
  }
  btnBorrar.style.display = "block";
  btnBorrar.onclick = () => {
    borrarPlato(plato.id);
    resetFormPlato();
  };

  document.getElementById("nombre-plato").focus();
}

function resetFormPlato() {
  formPlato.reset();
  delete formPlato.dataset.editando;
  document.querySelector("#form-plato .boton-principal").textContent = "Añadir plato";
  const btnBorrar = document.getElementById("btn-borrar-plato-edicion");
  if (btnBorrar) btnBorrar.style.display = "none";
  const panel = document.getElementById("zona-form-plato");
  panel.style.display = "none";
  document.getElementById("boton-anadir-plato").textContent = "+ Añadir";
}

function borrarPlato(id) {
  platos = platos.filter((p) => p.id !== id);
  guardarPlatos();
  pintarPlatos();
}

botonRestaurarPlatos.addEventListener("click", () => {
  if (!confirm("Esto reemplazará tus platos por los sugeridos. ¿Seguro?")) return;
  platos = crearPlatosSugeridos();
  guardarPlatos();
  pintarPlatos();
});

/* ------------------------------------------------------------
   VERDURA DE TEMPORADA (añadir como plato)
   ------------------------------------------------------------ */
const listaTemporada = document.getElementById("lista-temporada");
const textoTemporada = document.getElementById("texto-temporada");

function pintarTemporada() {
  if (!listaTemporada || !textoTemporada) return; // sección retirada
  const mes = new Date().getMonth();
  const verduras = VERDURA_TEMPORADA[mes];
  textoTemporada.textContent = `Verduras de ${NOMBRE_MESES[mes]}. Añádelas como plato a tu base.`;

  listaTemporada.innerHTML = "";
  verduras.forEach((v) => {
    const li = document.createElement("li");
    li.className = "item-tarea";

    const info = document.createElement("div");
    info.className = "item-info";
    const nombre = document.createElement("span");
    nombre.className = "item-nombre";
    nombre.textContent = v;
    info.appendChild(nombre);

    const btn = document.createElement("button");
    btn.className = "boton-secundario";
    btn.textContent = "+ Añadir";
    btn.title = "Añadir a mis platos (como primero y cena)";
    btn.addEventListener("click", () => {
      platos.push({ id: Date.now(), nombre: v, cat: ["primero", "cena"], ing: "verdura" });
      guardarPlatos();
      pintarPlatos();
      btn.textContent = "✓ Añadido";
      btn.disabled = true;
    });

    li.appendChild(info);
    li.appendChild(btn);
    listaTemporada.appendChild(li);
  });
}

/* ------------------------------------------------------------
   MENÚ DEL MES: carga el menú base de 4 semanas y permite
   restaurarlo. La edición manual por celda sigue disponible.
   ------------------------------------------------------------ */
const tablaMenu = document.getElementById("tabla-menu");
const menuVacio = document.getElementById("menu-vacio");
const botonGenerarMenu = document.getElementById("boton-generar-menu");

// Carga el menú base de 4 semanas en el calendario.
function restaurarMenuBase() {
  const menu = crearMenuBase();
  localStorage.setItem(CLAVE_MENU, JSON.stringify(menu));
  pintarMenu(menu);
}

function cargarMenu() {
  const datos = localStorage.getItem(CLAVE_MENU);
  if (datos) return JSON.parse(datos);
  // Primera vez (o sin menú guardado): usamos el menú base de 4 semanas.
  const base = crearMenuBase();
  localStorage.setItem(CLAVE_MENU, JSON.stringify(base));
  return base;
}

// HTML de un plato del menú con su puntito de color de ingrediente.
// Tolera el formato antiguo (donde el plato era solo un string).
function platoHTML(plato) {
  if (!plato) return "—";
  if (typeof plato === "string") return plato; // menús guardados antiguos
  const ing = INGREDIENTES[plato.ing];
  const punto = ing
    ? `<span class="chip-punto" style="background:${ing.color}"></span>`
    : "";
  return `${punto}${plato.nombre || ""}`;
}

// Menú actualmente mostrado (para poder editarlo a mano).
let menuActual = null;

function pintarMenu(menu) {
  menuActual = menu;
  if (!menu || menu.length === 0) {
    tablaMenu.innerHTML = "";
    menuVacio.style.display = "block";
    return;
  }
  menuVacio.style.display = "none";

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  let html = "";

  // 4 semanas, cada una como un bloque de calendario con fila
  // de comidas y fila de cenas. Cada celda guarda su índice de día.
  for (let semana = 0; semana < 4; semana++) {
    const dias = menu.slice(semana * 5, semana * 5 + 5);
    if (dias.length === 0) continue;

    html += `<div class="semana-bloque">`;
    html += `<div class="semana-titulo">Semana ${semana + 1}</div>`;
    html += `<table class="cal-tabla"><thead><tr>`;
    diasSemana.forEach((d) => (html += `<th>${d}</th>`));
    html += `</tr></thead><tbody>`;

    // Fila de comidas
    html += `<tr class="cal-fila">`;
    dias.forEach((d, i) => {
      const idx = semana * 5 + i;
      const txt = (d.comida || []).map(platoHTML).join(" + ") || "—";
      html += `<td class="cal-celda" data-dia="${idx}" data-tipo="comida" title="Click para editar">
        <span class="cal-etiqueta cal-comida">Comida ✎</span>
        <span class="cal-plato">${txt}</span></td>`;
    });
    html += `</tr>`;

    // Fila de cenas
    html += `<tr class="cal-fila">`;
    dias.forEach((d, i) => {
      const idx = semana * 5 + i;
      const txt = d.cena ? platoHTML(d.cena) : "—";
      html += `<td class="cal-celda" data-dia="${idx}" data-tipo="cena" title="Click para editar">
        <span class="cal-etiqueta cal-cena">Cena ✎</span>
        <span class="cal-plato">${txt}</span></td>`;
    });
    html += `</tr>`;

    html += `</tbody></table></div>`;
  }

  tablaMenu.innerHTML = html;

  // Hacemos clicables las celdas.
  tablaMenu.querySelectorAll(".cal-celda").forEach((celda) => {
    celda.addEventListener("click", () => {
      const dia = Number(celda.dataset.dia);
      const tipo = celda.dataset.tipo;
      abrirEditorCelda(celda, dia, tipo);
    });
  });

  // Refrescamos el "menú de hoy" del plan de tareas, por si cambió.
  if (typeof pintarMenuHoy === "function") pintarMenuHoy();
}

botonGenerarMenu.addEventListener("click", () => {
  if (!confirm("Esto reemplazará el menú actual por tu menú base de 4 semanas. ¿Seguro?")) return;
  restaurarMenuBase();
});

/* ------------------------------------------------------------
   EDICIÓN MANUAL DE UNA CELDA DEL MENÚ
   tipo = "comida" | "cena". Para comida: primero/segundo o único.
   Cada hueco es un desplegable de platos + opción "escribir otro".
   ------------------------------------------------------------ */
function guardarMenuActual() {
  localStorage.setItem(CLAVE_MENU, JSON.stringify(menuActual));
}

// Opciones <option> de platos de una categoría, marcando el actual.
function opcionesPlatos(categoria, nombreActual) {
  const lista = platos.filter((p) => p.cat.includes(categoria));
  let html = `<option value="">— (vacío) —</option>`;
  lista.forEach((p) => {
    const sel = p.nombre === nombreActual ? "selected" : "";
    html += `<option value="${p.id}" ${sel}>${p.nombre}</option>`;
  });
  html += `<option value="__otro__">✏️ Escribir otro...</option>`;
  return html;
}

function abrirEditorCelda(celda, dia, tipo) {
  // Cerramos cualquier editor abierto antes.
  document.querySelectorAll(".editor-celda").forEach((e) => e.remove());

  const d = menuActual[dia];
  const editor = document.createElement("div");
  editor.className = "editor-celda";

  if (tipo === "cena") {
    const actual = d.cena ? d.cena.nombre : "";
    editor.innerHTML =
      `<label class="editor-label">Cena</label>` +
      selectConOtro("cena", actual) +
      botonesEditor();
  } else {
    // Comida: primero + segundo, o plato único.
    const esUnico = (d.comida || []).length === 1 &&
      buscarPlatoPorNombre((d.comida[0] || {}).nombre)?.cat.includes("unico");
    const pr = d.comida && d.comida[0] ? d.comida[0].nombre : "";
    const sg = d.comida && d.comida[1] ? d.comida[1].nombre : "";

    editor.innerHTML =
      `<label class="editor-check-unico">
        <input type="checkbox" class="chk-unico" ${esUnico ? "checked" : ""} /> Plato único
      </label>
      <div class="editor-doble">
        <label class="editor-label">Primero</label>
        ${selectConOtro("primero", esUnico ? "" : pr)}
        <label class="editor-label">Segundo</label>
        ${selectConOtro("segundo", esUnico ? "" : sg)}
      </div>
      <div class="editor-unico" style="display:${esUnico ? "block" : "none"}">
        <label class="editor-label">Plato único</label>
        ${selectConOtro("unico", esUnico ? pr : "")}
      </div>` +
      botonesEditor();
  }

  celda.appendChild(editor);
  editor.addEventListener("click", (e) => e.stopPropagation());

  // Alternar único / doble.
  const chkUnico = editor.querySelector(".chk-unico");
  if (chkUnico) {
    chkUnico.addEventListener("change", () => {
      editor.querySelector(".editor-doble").style.display = chkUnico.checked ? "none" : "block";
      editor.querySelector(".editor-unico").style.display = chkUnico.checked ? "block" : "none";
    });
  }

  // Enlazar los select "escribir otro" con su input de texto.
  editor.querySelectorAll(".sel-plato").forEach((sel) => {
    sel.addEventListener("change", () => {
      const input = sel.parentElement.querySelector(".input-otro");
      input.style.display = sel.value === "__otro__" ? "block" : "none";
      if (sel.value === "__otro__") input.focus();
    });
  });

  // Guardar / cancelar.
  editor.querySelector(".editor-guardar").addEventListener("click", () => {
    guardarEdicionCelda(editor, dia, tipo);
  });
  editor.querySelector(".editor-cancelar").addEventListener("click", () => {
    editor.remove();
  });
}

// Un select de platos + un input oculto para "escribir otro".
function selectConOtro(categoria, nombreActual) {
  return `<div class="sel-grupo">
    <select class="sel-plato" data-cat="${categoria}">${opcionesPlatos(categoria, nombreActual)}</select>
    <input type="text" class="input-otro" placeholder="Escribe el plato" style="display:none;" />
  </div>`;
}

function botonesEditor() {
  return `<div class="editor-botones">
    <button class="editor-guardar boton-principal">Guardar</button>
    <button class="editor-cancelar boton-secundario">Cancelar</button>
  </div>`;
}

function buscarPlatoPorNombre(nombre) {
  return platos.find((p) => p.nombre === nombre) || null;
}

// Lee el valor elegido en un .sel-grupo: devuelve {nombre, ing} o null.
function leerSeleccion(grupo) {
  const sel = grupo.querySelector(".sel-plato");
  const input = grupo.querySelector(".input-otro");
  if (sel.value === "__otro__") {
    const texto = input.value.trim();
    return texto ? { nombre: texto, ing: null } : null;
  }
  if (sel.value === "") return null;
  const plato = platos.find((p) => p.id === Number(sel.value));
  return plato ? { nombre: plato.nombre, ing: plato.ing } : null;
}

function guardarEdicionCelda(editor, dia, tipo) {
  const d = menuActual[dia];

  if (tipo === "cena") {
    const grupo = editor.querySelector(".sel-grupo");
    d.cena = leerSeleccion(grupo);
  } else {
    const esUnico = editor.querySelector(".chk-unico").checked;
    if (esUnico) {
      const grupo = editor.querySelector(".editor-unico .sel-grupo");
      const u = leerSeleccion(grupo);
      d.comida = u ? [u] : [];
    } else {
      const grupos = editor.querySelectorAll(".editor-doble .sel-grupo");
      const pr = leerSeleccion(grupos[0]);
      const sg = leerSeleccion(grupos[1]);
      d.comida = [pr, sg].filter(Boolean);
    }
  }

  guardarMenuActual();
  pintarMenu(menuActual);
}

/* ------------------------------------------------------------
   FORMULARIO AÑADIR PLATO: botón "+"
   ------------------------------------------------------------ */
const botonAnadirPlato = document.getElementById("boton-anadir-plato");
const zonaFormPlato = document.getElementById("zona-form-plato");

botonAnadirPlato.addEventListener("click", () => {
  const visible = zonaFormPlato.style.display === "block";
  if (visible) {
    resetFormPlato();
  } else {
    // Abrir en modo "añadir" limpio.
    resetFormPlato();
    zonaFormPlato.style.display = "block";
    botonAnadirPlato.textContent = "✕ Cerrar";
    document.getElementById("nombre-plato").focus();
  }
});

/* ------------------------------------------------------------
   PESTAÑAS GRANDES DE VISTA (Tareas / Menús)
   ------------------------------------------------------------ */
const vistaTabs = document.querySelectorAll(".vista-tab");
const vistas = {
  plan: document.getElementById("vista-plan"),
  tareas: document.getElementById("vista-tareas"),
  menus: document.getElementById("vista-menus"),
};

vistaTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    vistaTabs.forEach((t) => t.classList.remove("vista-tab-activa"));
    tab.classList.add("vista-tab-activa");
    const destino = tab.dataset.vista;
    Object.keys(vistas).forEach((k) => {
      vistas[k].classList.toggle("vista-activa", k === destino);
    });
  });
});

/* ------------------------------------------------------------
   PESTAÑAS INTERNAS DE MENÚS (solo móvil)
   ------------------------------------------------------------ */
const tabsMenu = document.querySelectorAll(".tab-menu");
const columnasMenu = {
  platos: document.getElementById("col-platos"),
  menu: document.getElementById("col-menu"),
};

tabsMenu.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabsMenu.forEach((t) => t.classList.remove("tab-menu-activa"));
    tab.classList.add("tab-menu-activa");
    const destino = tab.dataset.tabmenu;
    Object.keys(columnasMenu).forEach((k) => {
      columnasMenu[k].classList.toggle("colmenu-activa", k === destino);
    });
  });
});

/* ------------------------------------------------------------
   ARRANQUE DEL MÓDULO DE MENÚS
   ------------------------------------------------------------ */
// Cerrar el editor de celda al hacer click fuera de él.
document.addEventListener("click", (e) => {
  if (!e.target.closest(".editor-celda") && !e.target.closest(".cal-celda")) {
    document.querySelectorAll(".editor-celda").forEach((el) => el.remove());
  }
});

pintarFiltros();
pintarPlatos();
pintarTemporada();
pintarMenu(cargarMenu());
