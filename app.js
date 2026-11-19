/**
 * Sistema Web Integral - Car Wash & Oleocentro "San Juan"
 * Arquitectura de 3 Capas adaptada a Frontend Persistente (LocalStorage + SHA-256)
 * Cumplimiento de RF01-RF18 y RNF01-RNF14 (ISO/IEC 25010)
 */

// ==================== CAPA DE DATOS (Entidades del Diagrama de Clases) ====================
const MULTIPLICADOR_VEHICULO = {
    AUTO: 1.0,
    CAMIONETA: 1.25,
    MOTOCICLETA: 0.65,
    OTRO: 1.4
};

const DB_KEYS = {
    USUARIOS: 'cwsj_usuarios_v2',
    VEHICULOS: 'cwsj_vehiculos_v2',
    SERVICIOS: 'cwsj_servicios_v2',
    RESERVAS: 'cwsj_reservas_v2',
    SESION: 'cwsj_sesion_v2'
};

// Hash SHA-256 para protección de contraseñas (RNF04)
async function generarHash(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let db = {
    usuarios: JSON.parse(localStorage.getItem(DB_KEYS.USUARIOS)) || [],
    vehiculos: JSON.parse(localStorage.getItem(DB_KEYS.VEHICULOS)) || [],
    servicios: JSON.parse(localStorage.getItem(DB_KEYS.SERVICIOS)) || [],
    reservas: JSON.parse(localStorage.getItem(DB_KEYS.RESERVAS)) || [],
    sesion: JSON.parse(localStorage.getItem(DB_KEYS.SESION)) || null
};

function persistirDB() {
    localStorage.setItem(DB_KEYS.USUARIOS, JSON.stringify(db.usuarios));
    localStorage.setItem(DB_KEYS.VEHICULOS, JSON.stringify(db.vehiculos));
    localStorage.setItem(DB_KEYS.SERVICIOS, JSON.stringify(db.servicios));
    localStorage.setItem(DB_KEYS.RESERVAS, JSON.stringify(db.reservas));
    localStorage.setItem(DB_KEYS.SESION, JSON.stringify(db.sesion));
}

// Datos semilla iniciales si la BD está vacía
async function inicializarDatosSemilla() {
    if (db.usuarios.length === 0) {
        const claveHash = await generarHash('123456');
        db.usuarios = [
            { idUsuario: 1, nombres: 'Hoower', apellidos: 'Administrador', correo: 'admin@carwash.com', telefono: '987654321', contrasenaHash: claveHash, rol: 'ADMINISTRADOR', estado: true },
            { idUsuario: 2, nombres: 'Luis', apellidos: 'Operador Lavado', correo: 'personal@carwash.com', telefono: '987654322', contrasenaHash: claveHash, rol: 'PERSONAL', estado: true },
            { idUsuario: 3, nombres: 'Robyn', apellidos: 'Chuquihuanga', correo: 'cliente@carwash.com', telefono: '987654323', contrasenaHash: claveHash, rol: 'CLIENTE', estado: true }
        ];
    }

    if (db.vehiculos.length === 0) {
        db.vehiculos = [
            { idVehiculo: 101, idUsuario: 3, placa: 'P1B-458', marca: 'Toyota', modelo: 'Yaris', color: 'Plata', tipo: 'AUTO' },
            { idVehiculo: 102, idUsuario: 3, placa: 'T2C-890', marca: 'Toyota', modelo: 'Hilux', color: 'Blanco', tipo: 'CAMIONETA' }
        ];
    }

    if (db.servicios.length === 0) {
        db.servicios = [
            { idServicio: 1, nombre: 'Lavado Básico Exterior', descripcion: 'Lavado con shampoo neutro, limpieza de aros, llantas y secado con microfibra.', precio: 25.00, duracionMinutos: 30, estado: true },
            { idServicio: 2, nombre: 'Lavado Salón Completo', descripcion: 'Lavado exterior, aspirado profundo de alfombras/asientos, limpieza de tablero y aromatizado.', precio: 45.00, duracionMinutos: 60, estado: true },
            { idServicio: 3, nombre: 'Lavado de Motor y Chasis', descripcion: 'Desengrase seguro de motor y lavado a presión de chasis inferior.', precio: 55.00, duracionMinutos: 50, estado: true },
            { idServicio: 4, nombre: 'Cambio de Aceite + Filtro (Repsol)', descripcion: 'Mantenimiento preventivo con lubricantes originales Repsol/Mobil y revisión de niveles.', precio: 120.00, duracionMinutos: 45, estado: true },
            { idServicio: 5, nombre: 'Pulido y Encerado Protector', descripcion: 'Tratamiento de pintura para brillo espejo y protección contra rayos UV.', precio: 90.00, duracionMinutos: 90, estado: true }
        ];
    }

    if (db.reservas.length === 0) {
        const hoy = new Date().toISOString().split('T')[0];
        db.reservas = [
            {
                idReserva: 1001,
                idUsuario: 3,
                idVehiculo: 101,
                idServicio: 2,
                precioAplicado: 45.00,
                fechaReserva: hoy,
                horaReserva: '10:30',
                observaciones: 'Cuidado con sensores de retroceso.',
                estadoReserva: 'CONFIRMADA',
                atencion: {
                    idAtencion: 501,
                    fechaIngreso: `${hoy} 10:25`,
                    fechaFin: null,
                    estado: 'EN_PROCESO', // RECIBIDO | EN_PROCESO | FINALIZADO | ENTREGADO
                    historial: [
                        { fecha: `${hoy} 09:00`, estado: 'RESERVA_CREADA', descripcion: 'Reserva agendada por el cliente en línea.' },
                        { fecha: `${hoy} 10:25`, estado: 'RECIBIDO', descripcion: 'Vehículo recepcionado en rampa de ingreso.' },
                        { fecha: `${hoy} 10:32`, estado: 'EN_PROCESO', descripcion: 'Inicio de lavado exterior y aspirado interior.' }
                    ]
                },
                pago: {
                    idPago: 801,
                    monto: 45.00,
                    metodoPago: 'TRANSFERENCIA',
                    referencia: 'YAPE-99412',
                    estado: 'PAGADO',
                    fechaPago: `${hoy} 10:26`
                }
            }
        ];
    }
    persistirDB();
}

// Notificación visual Toast (RNF01)
function notificar(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    const id = 'toast_' + Date.now();
    const bg = tipo === 'error' ? 'bg-danger' : (tipo === 'warning' ? 'bg-warning text-dark' : 'bg-success');
    container.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="toast align-items-center text-white ${bg} border-0 show mb-2" role="alert">
            <div class="d-flex">
                <div class="toast-body fw-semibold">${mensaje}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `);
    setTimeout(() => document.getElementById(id)?.remove(), 4000);
}

// ==================== INICIALIZACIÓN DE INTERFAZ ====================
document.addEventListener('DOMContentLoaded', async () => {
    await inicializarDatosSemilla();
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('rFecha').min = hoy;
    document.getElementById('editResFecha').min = hoy;
    renderCatalogo();
    actualizarEstadoSesionUI();
});

// ==================== CATÁLOGO DE SERVICIOS (RF04) ====================
function renderCatalogo() {
    const tipoVehiculo = document.getElementById('filtroTipoVehiculo').value;
    const factor = MULTIPLICADOR_VEHICULO[tipoVehiculo] || 1;
    const grid = document.getElementById('gridServicios');
    const activos = db.servicios.filter(s => s.estado);

    grid.innerHTML = activos.map(s => {
        const precioFinal = (s.precio * factor).toFixed(2);
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card card-servicio h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <h5 class="card-title fw-bold mb-0">${s.nombre}</h5>
                            <span class="badge bg-primary fs-6">S/ ${precioFinal}</span>
                        </div>
                        <p class="card-text text-muted small flex-grow-1">${s.descripcion}</p>
                        <div class="d-flex justify-content-between align-items-center pt-2 border-top small">
                            <span class="text-secondary"><i class="bi bi-clock me-1"></i>Aprox. ${s.duracionMinutos} min</span>
                            <span class="badge bg-light text-dark border">${tipoVehiculo}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== AUTENTICACIÓN Y ROLES (RF01, RF02, RF03, RNF03, RNF04) ====================
function actualizarEstadoSesionUI() {
    const zonaSesion = document.getElementById('zonaSesion');
    const navCliente = document.getElementById('navCliente');
    const navOperativo = document.getElementById('navOperativo');
    const panelCliente = document.getElementById('panelCliente');
    const panelOperativo = document.getElementById('panelOperativo');
    const btnCta = document.getElementById('btnCtaPrincipal');

    if (!db.sesion) return;

    zonaSesion.innerHTML = `
        <span class="badge bg-warning text-dark">${db.sesion.rol}</span>
        <span class="text-white small fw-semibold">${db.sesion.nombres} ${db.sesion.apellidos}</span>
        <button class="btn btn-outline-danger btn-sm" onclick="cerrarSesion()">
            <i class="bi bi-box-arrow-right"></i> Salir
        </button>
    `;

    btnCta.removeAttribute('data-bs-toggle');
    btnCta.onclick = () => location.href = db.sesion.rol === 'CLIENTE' ? '#panelCliente' : '#panelOperativo';

    if (db.sesion.rol === 'CLIENTE') {
        navCliente.classList.remove('d-none');
        panelCliente.classList.remove('d-none');
        document.getElementById('badgeClienteNombre').textContent = `${db.sesion.nombres} ${db.sesion.apellidos}`;
        renderClientePanel();
    } else {
        navOperativo.classList.remove('d-none');
        panelOperativo.classList.remove('d-none');
        document.getElementById('subtituloRolOperativo').textContent =
            db.sesion.rol === 'ADMINISTRADOR'
                ? 'Acceso total: Administración de servicios, usuarios, atención vehicular y reportes.'
                : 'Acceso operativo: Recepción vehicular, actualización de estados de lavado y registro de pagos.';

        if (db.sesion.rol === 'ADMINISTRADOR') {
            document.getElementById('tabItemServicios').classList.remove('d-none');
            document.getElementById('tabItemUsuarios').classList.remove('d-none');
        }
        renderPanelOperativo();
    }
}

document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('regCorreo').value.trim().toLowerCase();
    if (db.usuarios.some(u => u.correo === correo)) {
        return notificar('El correo ya está registrado en el sistema.', 'error');
    }
    const nuevoUsuario = {
        idUsuario: Date.now(),
        nombres: document.getElementById('regNombres').value.trim(),
        apellidos: document.getElementById('regApellidos').value.trim(),
        correo,
        telefono: document.getElementById('regTelefono').value.trim(),
        contrasenaHash: await generarHash(document.getElementById('regClave').value),
        rol: 'CLIENTE',
        estado: true
    };
    db.usuarios.push(nuevoUsuario);
    persistirDB();
    bootstrap.Modal.getInstance(document.getElementById('modalRegistro')).hide();
    e.target.reset();
    notificar('Registro exitoso. Ya puedes iniciar sesión.');
});

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('loginCorreo').value.trim().toLowerCase();
    const hash = await generarHash(document.getElementById('loginClave').value);
    const usuario = db.usuarios.find(u => u.correo === correo && u.contrasenaHash === hash);

    if (!usuario) return notificar('Correo o contraseña incorrectos.', 'error');
    if (!usuario.estado) return notificar('Esta cuenta se encuentra deshabilitada.', 'error');

    db.sesion = usuario;
    persistirDB();
    location.reload();
});

function cerrarSesion() {
    db.sesion = null;
    persistirDB();
    location.reload();
}

// ==================== MÓDULO CLIENTE: VEHÍCULOS Y RESERVAS (RF06, RF07, RF08, RF10, RF13, RF16) ====================
function renderClientePanel() {
    // 1. Renderizar vehículos del cliente
    const misVehiculos = db.vehiculos.filter(v => v.idUsuario === db.sesion.idUsuario);
    document.getElementById('contadorVehiculos').textContent = misVehiculos.length;

    const listaV = document.getElementById('listaMisVehiculos');
    listaV.innerHTML = misVehiculos.length
        ? misVehiculos.map(v => `
            <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
                <div><strong>${v.placa}</strong> • ${v.marca} ${v.modelo} (${v.color})</div>
                <span class="badge bg-secondary">${v.tipo}</span>
            </li>`).join('')
        : '<li class="list-group-item px-0 text-muted">Aún no tienes vehículos registrados.</li>';

    const selVehiculo = document.getElementById('rVehiculo');
    selVehiculo.innerHTML = misVehiculos.length
        ? misVehiculos.map(v => `<option value="${v.idVehiculo}">${v.placa} - ${v.marca} ${v.modelo} (${v.tipo})</option>`).join('')
        : '<option value="">Registre un vehículo arriba primero</option>';

    // 2. Renderizar servicios activos en el formulario
    const selServicio = document.getElementById('rServicio');
    selServicio.innerHTML = db.servicios.filter(s => s.estado)
        .map(s => `<option value="${s.idServicio}">${s.nombre}</option>`).join('');

    actualizarPrecioReserva();

    // 3. Renderizar tarjetas de seguimiento en tiempo real e historial
    const misReservas = db.reservas
        .filter(r => r.idUsuario === db.sesion.idUsuario)
        .sort((a, b) => b.idReserva - a.idReserva);

    const cont = document.getElementById('contenedorReservasCliente');
    if (!misReservas.length) {
        cont.innerHTML = '<div class="text-center text-muted py-4">No tienes reservas registradas. Agenda tu primera cita desde el formulario izquierdo.</div>';
        return;
    }

    const pasos = ['RECIBIDO', 'EN_PROCESO', 'FINALIZADO', 'ENTREGADO'];
    const etiquetas = { RECIBIDO: 'En Espera', EN_PROCESO: 'En Lavado', FINALIZADO: 'Finalizado', ENTREGADO: 'Entregado' };

    cont.innerHTML = misReservas.map(r => {
        const veh = db.vehiculos.find(v => v.idVehiculo === r.idVehiculo) || {};
        const serv = db.servicios.find(s => s.idServicio === r.idServicio) || {};
        const idxActual = pasos.indexOf(r.atencion.estado);
        const esCancelada = r.estadoReserva === 'CANCELADA';

        return `
            <div class="border rounded p-3 mb-3 ${esCancelada ? 'bg-light opacity-75' : 'bg-white shadow-sm'}">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pb-2 mb-2">
                    <div>
                        <span class="badge bg-dark me-1">#${r.idReserva}</span>
                        <strong>${serv.nombre}</strong> — <span class="text-primary fw-bold">${veh.placa} (${veh.marca} ${veh.modelo})</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${r.pago.estado === 'PAGADO' ? 'bg-success' : 'bg-warning text-dark'}">
                            Pago: ${r.pago.estado} (S/ ${Number(r.precioAplicado).toFixed(2)})
                        </span>
                        <span class="badge ${esCancelada ? 'bg-danger' : 'bg-info text-dark'}">${r.estadoReserva}</span>
                    </div>
                </div>

                <div class="row small text-muted mb-2">
                    <div class="col-sm-6"><i class="bi bi-calendar-event me-1"></i>Cita: <strong>${r.fechaReserva} a las ${r.horaReserva}</strong></div>
                    <div class="col-sm-6"><i class="bi bi-credit-card me-1"></i>Método: ${r.pago.metodoPago}</div>
                </div>

                ${!esCancelada ? `
                <!-- Barra de Seguimiento en Tiempo Real (RF13) -->
                <div class="stepper-lavado">
                    ${pasos.map((p, i) => `
                        <div class="step-item ${i < idxActual ? 'done' : (i === idxActual ? 'active' : '')}">
                            <div class="step-circle">${i < idxActual ? '✓' : i + 1}</div>
                            <div class="small fw-semibold mt-1" style="font-size:0.75rem">${etiquetas[p]}</div>
                        </div>
                    `).join('')}
                </div>` : ''}

                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
                    <button class="btn btn-outline-secondary btn-sm" onclick="verHistorial(${r.idReserva})">
                        <i class="bi bi-clock-history me-1"></i>Ver Bitácora
                    </button>
                    <div class="d-flex gap-2">
                        ${!esCancelada && r.atencion.estado === 'RECIBIDO' ? `
                            <button class="btn btn-outline-primary btn-sm" onclick="abrirEditarReserva(${r.idReserva})">
                                <i class="bi bi-pencil me-1"></i>Reprogramar (RF07)
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="cancelarReserva(${r.idReserva})">
                                <i class="bi bi-x-circle me-1"></i>Cancelar (RF08)
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function actualizarPrecioReserva() {
    const idVeh = Number(document.getElementById('rVehiculo').value);
    const idServ = Number(document.getElementById('rServicio').value);
    const veh = db.vehiculos.find(v => v.idVehiculo === idVeh);
    const serv = db.servicios.find(s => s.idServicio === idServ);

    if (!serv) return;
    const factor = veh ? (MULTIPLICADOR_VEHICULO[veh.tipo] || 1) : 1;
    document.getElementById('precioEstimadoReserva').textContent = `S/ ${(serv.precio * factor).toFixed(2)}`;
}

// Registrar Vehículo (RF10)
document.getElementById('formVehiculo').addEventListener('submit', (e) => {
    e.preventDefault();
    const placa = document.getElementById('vPlaca').value.trim().toUpperCase();
    if (db.vehiculos.some(v => v.placa === placa)) {
        return notificar('Esa placa ya se encuentra registrada.', 'error');
    }
    db.vehiculos.push({
        idVehiculo: Date.now(),
        idUsuario: db.sesion.idUsuario,
        placa,
        marca: document.getElementById('vMarca').value.trim(),
        modelo: document.getElementById('vModelo').value.trim(),
        color: document.getElementById('vColor').value.trim(),
        tipo: document.getElementById('vTipo').value
    });
    persistirDB();
    e.target.reset();
    renderClientePanel();
    notificar('Vehículo registrado correctamente.');
});

// Crear Reserva (RF06)
document.getElementById('formReserva').addEventListener('submit', (e) => {
    e.preventDefault();
    const idVehiculo = Number(document.getElementById('rVehiculo').value);
    if (!idVehiculo) return notificar('Primero debes registrar y seleccionar un vehículo.', 'error');

    const idServicio = Number(document.getElementById('rServicio').value);
    const fechaReserva = document.getElementById('rFecha').value;
    const horaReserva = document.getElementById('rHora').value;

    // Validar cruce de horario en el mismo turno (RF17)
    const ocupado = db.reservas.some(r => r.fechaReserva === fechaReserva && r.horaReserva === horaReserva && r.estadoReserva !== 'CANCELADA');
    if (ocupado) return notificar('Ese horario ya está reservado. Elige otra hora disponible.', 'warning');

    const veh = db.vehiculos.find(v => v.idVehiculo === idVehiculo);
    const serv = db.servicios.find(s => s.idServicio === idServicio);
    const precioFinal = Number((serv.precio * (MULTIPLICADOR_VEHICULO[veh.tipo] || 1)).toFixed(2));
    const ahora = new Date().toLocaleString();

    db.reservas.push({
        idReserva: Math.floor(1000 + Math.random() * 9000),
        idUsuario: db.sesion.idUsuario,
        idVehiculo,
        idServicio,
        precioAplicado: precioFinal,
        fechaReserva,
        horaReserva,
        observaciones: document.getElementById('rObservaciones').value.trim(),
        estadoReserva: 'CONFIRMADA',
        atencion: {
            idAtencion: Date.now(),
            fechaIngreso: null,
            fechaFin: null,
            estado: 'RECIBIDO',
            historial: [
                { fecha: ahora, estado: 'RESERVA_CREADA', descripcion: `Reserva confirmada para ${fechaReserva} ${horaReserva}.` }
            ]
        },
        pago: {
            idPago: Date.now() + 1,
            monto: precioFinal,
            metodoPago: document.getElementById('rMetodoPago').value,
            referencia: '',
            estado: 'PENDIENTE',
            fechaPago: null
        }
    });

    persistirDB();
    e.target.reset();
    renderClientePanel();
    notificar('¡Reserva confirmada con éxito!');
});

// Modificar Reserva (RF07)
function abrirEditarReserva(idReserva) {
    const r = db.reservas.find(x => x.idReserva === idReserva);
    document.getElementById('editResId').value = r.idReserva;
    document.getElementById('editResFecha').value = r.fechaReserva;
    document.getElementById('editResHora').value = r.horaReserva;
    document.getElementById('editResObs').value = r.observaciones;
    new bootstrap.Modal(document.getElementById('modalEditarReserva')).show();
}

document.getElementById('formEditarReserva').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('editResId').value);
    const r = db.reservas.find(x => x.idReserva === id);
    r.fechaReserva = document.getElementById('editResFecha').value;
    r.horaReserva = document.getElementById('editResHora').value;
    r.observaciones = document.getElementById('editResObs').value.trim();
    r.atencion.historial.push({
        fecha: new Date().toLocaleString(),
        estado: 'MODIFICADA',
        descripcion: `Reserva reprogramada por el cliente para ${r.fechaReserva} a las ${r.horaReserva}.`
    });
    persistirDB();
    bootstrap.Modal.getInstance(document.getElementById('modalEditarReserva')).hide();
    renderClientePanel();
    notificar('Reserva reprogramada correctamente.');
});

// Cancelar Reserva (RF08)
function cancelarReserva(idReserva) {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    const r = db.reservas.find(x => x.idReserva === idReserva);
    r.estadoReserva = 'CANCELADA';
    r.pago.estado = 'ANULADO';
    r.atencion.historial.push({
        fecha: new Date().toLocaleString(),
        estado: 'CANCELADA',
        descripcion: 'Reserva cancelada por el cliente.'
    });
    persistirDB();
    renderClientePanel();
    notificar('Reserva cancelada.', 'warning');
}

// ==================== PANEL OPERATIVO Y ADMINISTRATIVO (RF03, RF05, RF09, RF11, RF12, RF14, RF15, RF18) ====================
function renderPanelOperativo() {
    renderKPIs();
    renderTablaOperativa();
    if (db.sesion.rol === 'ADMINISTRADOR') {
        renderTablaAdminServicios();
        renderTablaAdminUsuarios();
    }
}

function renderKPIs() {
    const activas = db.reservas.filter(r => r.estadoReserva !== 'CANCELADA');
    const enLavado = activas.filter(r => r.atencion.estado === 'EN_PROCESO').length;
    const finalizadas = activas.filter(r => ['FINALIZADO', 'ENTREGADO'].includes(r.atencion.estado)).length;
    const recaudado = db.reservas.filter(r => r.pago.estado === 'PAGADO').reduce((acc, r) => acc + r.precioAplicado, 0);

    document.getElementById('kpiOperativo').innerHTML = `
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm p-3"><small class="text-muted">Total Reservas Activas</small><h4 class="fw-bold mb-0">${activas.length}</h4></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm p-3"><small class="text-muted">Vehículos en Lavado</small><h4 class="fw-bold text-primary mb-0">${enLavado}</h4></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm p-3"><small class="text-muted">Servicios Completados</small><h4 class="fw-bold text-success mb-0">${finalizadas}</h4></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm p-3"><small class="text-muted">Ingresos Recaudados</small><h4 class="fw-bold text-warning mb-0">S/ ${recaudado.toFixed(2)}</h4></div></div>
    `;
}

function renderTablaOperativa() {
    const filtro = document.getElementById('buscadorAtencion').value.toLowerCase();
    const tbody = document.getElementById('tbodyOperativo');

    const filtradas = db.reservas
        .filter(r => {
            const cli = db.usuarios.find(u => u.idUsuario === r.idUsuario) || {};
            const veh = db.vehiculos.find(v => v.idVehiculo === r.idVehiculo) || {};
            return `${cli.nombres} ${cli.apellidos} ${veh.placa} ${r.idReserva}`.toLowerCase().includes(filtro);
        })
        .sort((a, b) => b.idReserva - a.idReserva);

    tbody.innerHTML = filtradas.map(r => {
        const cli = db.usuarios.find(u => u.idUsuario === r.idUsuario) || {};
        const veh = db.vehiculos.find(v => v.idVehiculo === r.idVehiculo) || {};
        const serv = db.servicios.find(s => s.idServicio === r.idServicio) || {};
        const cancelada = r.estadoReserva === 'CANCELADA';

        return `
            <tr class="${cancelada ? 'table-secondary opacity-75' : ''}">
                <td class="fw-bold">#${r.idReserva}</td>
                <td>${cli.nombres} ${cli.apellidos}<br><small class="text-muted"><i class="bi bi-whatsapp"></i> ${cli.telefono}</small></td>
                <td><strong>${veh.placa}</strong><br><small>${veh.marca} ${veh.modelo} (${veh.tipo})</small></td>
                <td>${serv.nombre}<br><strong>S/ ${r.precioAplicado.toFixed(2)}</strong></td>
                <td>
                    <div>${r.fechaReserva} ${r.horaReserva}</div>
                    ${r.atencion.fechaIngreso
                        ? `<span class="badge bg-success-subtle text-success border border-success">Ingresó: ${r.atencion.fechaIngreso}</span>`
                        : (!cancelada ? `<button class="btn btn-outline-primary btn-sm mt-1" onclick="registrarRecepcion(${r.idReserva})">Registrar Ingreso (RF11)</button>` : '')}
                </td>
                <td>
                    ${cancelada ? '<span class="badge bg-danger">CANCELADA</span>' : `
                    <select class="form-select form-select-sm" onchange="actualizarEstadoAtencion(${r.idReserva}, this.value)">
                        <option value="RECIBIDO" ${r.atencion.estado === 'RECIBIDO' ? 'selected' : ''}>En Espera (Recibido)</option>
                        <option value="EN_PROCESO" ${r.atencion.estado === 'EN_PROCESO' ? 'selected' : ''}>En Lavado / Proceso</option>
                        <option value="FINALIZADO" ${r.atencion.estado === 'FINALIZADO' ? 'selected' : ''}>Finalizado</option>
                        <option value="ENTREGADO" ${r.atencion.estado === 'ENTREGADO' ? 'selected' : ''}>Entregado al Cliente</option>
                    </select>`}
                </td>
                <td>
                    ${r.pago.estado === 'PAGADO'
                        ? `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>PAGADO (${r.pago.metodoPago})</span><br><small class="text-muted">Ref: ${r.pago.referencia}</small>`
                        : (!cancelada ? `<button class="btn btn-success btn-sm" onclick="registrarPago(${r.idReserva})"><i class="bi bi-cash-coin me-1"></i>Cobrar</button>` : '<span class="badge bg-secondary">ANULADO</span>')}
                </td>
                <td>
                    <button class="btn btn-outline-dark btn-sm" onclick="verHistorial(${r.idReserva})" title="Ver bitácora">
                        <i class="bi bi-clock-history"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Registrar Recepción del Vehículo en el local (RF11)
function registrarRecepcion(idReserva) {
    const r = db.reservas.find(x => x.idReserva === idReserva);
    const ahora = new Date().toLocaleString();
    r.atencion.fechaIngreso = ahora;
    r.atencion.historial.push({
        fecha: ahora,
        estado: 'RECEPCION_LOCAL',
        descripcion: `Vehículo ingresó físicamente al establecimiento (registrado por ${db.sesion.nombres}).`
    });
    persistirDB();
    renderPanelOperativo();
    notificar('Recepción vehicular registrada.');
}

// Actualizar Estado del Servicio (RF12)
function actualizarEstadoAtencion(idReserva, nuevoEstado) {
    const r = db.reservas.find(x => x.idReserva === idReserva);
    const ahora = new Date().toLocaleString();
    r.atencion.estado = nuevoEstado;
    if (nuevoEstado === 'FINALIZADO') r.atencion.fechaFin = ahora;
    if (nuevoEstado === 'ENTREGADO') r.estadoReserva = 'ATENDIDA';

    r.atencion.historial.push({
        fecha: ahora,
        estado: nuevoEstado,
        descripcion: `Estado actualizado a ${nuevoEstado} por ${db.sesion.nombres}.`
    });
    persistirDB();
    renderPanelOperativo();
    notificar(`Estado actualizado a ${nuevoEstado}.`);
}

// Registrar Pago (RF14 + RF15)
function registrarPago(idReserva) {
    const r = db.reservas.find(x => x.idReserva === idReserva);
    const ref = prompt(`Confirmar cobro de S/ ${r.precioAplicado.toFixed(2)} (${r.pago.metodoPago}).\nIngrese N° de operación o comprobante:`, 'BOLETA-00' + r.idReserva);
    if (ref === null) return;

    const ahora = new Date().toLocaleString();
    r.pago.estado = 'PAGADO';
    r.pago.referencia = ref.trim() || 'CAJA-LOCAL';
    r.pago.fechaPago = ahora;

    r.atencion.historial.push({
        fecha: ahora,
        estado: 'PAGO_CONFIRMADO',
        descripcion: `Pago de S/ ${r.precioAplicado.toFixed(2)} registrado (${r.pago.metodoPago} - Ref: ${r.pago.referencia}).`
    });
    persistirDB();
    renderPanelOperativo();
    notificar('Pago registrado correctamente.');
}

// Ver Bitácora de Trazabilidad (RNF14)
function verHistorial(idReserva) {
    const r = db.reservas.find(x => x.idReserva === idReserva);
    document.getElementById('cuerpoModalHistorial').innerHTML = r.atencion.historial.map(h => `
        <div class="timeline-item">
            <div class="small text-muted">${h.fecha}</div>
            <div class="fw-bold text-primary">${h.estado}</div>
            <div class="small">${h.descripcion}</div>
        </div>
    `).join('');
    new bootstrap.Modal(document.getElementById('modalHistorial')).show();
}

// ==================== ADMINISTRACIÓN DE SERVICIOS Y USUARIOS (RF03, RF05) ====================
function renderTablaAdminServicios() {
    document.getElementById('tbodyAdminServicios').innerHTML = db.servicios.map(s => `
        <tr>
            <td>${s.idServicio}</td>
            <td class="fw-bold">${s.nombre}</td>
            <td>${s.descripcion}</td>
            <td>S/ ${Number(s.precio).toFixed(2)}</td>
            <td>${s.duracionMinutos} min</td>
            <td><span class="badge ${s.estado ? 'bg-success' : 'bg-secondary'}">${s.estado ? 'Activo' : 'Deshabilitado'}</span></td>
            <td class="text-nowrap">
                <button class="btn btn-outline-primary btn-sm" onclick="abrirModalServicio(${s.idServicio})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-outline-${s.estado ? 'danger' : 'success'} btn-sm" onclick="toggleEstadoServicio(${s.idServicio})">
                    <i class="bi bi-${s.estado ? 'slash-circle' : 'check-circle'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function abrirModalServicio(id = null) {
    document.getElementById('formServicio').reset();
    document.getElementById('servId').value = id || '';
    document.getElementById('tituloModalServicio').textContent = id ? 'Editar Servicio' : 'Registrar Nuevo Servicio';
    if (id) {
        const s = db.servicios.find(x => x.idServicio === id);
        document.getElementById('servNombre').value = s.nombre;
        document.getElementById('servDesc').value = s.descripcion;
        document.getElementById('servPrecio').value = s.precio;
        document.getElementById('servDuracion').value = s.duracionMinutos;
    }
    new bootstrap.Modal(document.getElementById('modalServicio')).show();
}

document.getElementById('formServicio').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('servId').value;
    const datos = {
        nombre: document.getElementById('servNombre').value.trim(),
        descripcion: document.getElementById('servDesc').value.trim(),
        precio: Number(document.getElementById('servPrecio').value),
        duracionMinutos: Number(document.getElementById('servDuracion').value)
    };

    if (id) {
        Object.assign(db.servicios.find(x => x.idServicio === Number(id)), datos);
        notificar('Servicio actualizado.');
    } else {
        db.servicios.push({ idServicio: Date.now(), ...datos, estado: true });
        notificar('Nuevo servicio agregado al catálogo.');
    }
    persistirDB();
    bootstrap.Modal.getInstance(document.getElementById('modalServicio')).hide();
    renderCatalogo();
    renderTablaAdminServicios();
});

function toggleEstadoServicio(id) {
    const s = db.servicios.find(x => x.idServicio === id);
    s.estado = !s.estado;
    persistirDB();
    renderCatalogo();
    renderTablaAdminServicios();
    notificar(`Servicio ${s.estado ? 'habilitado' : 'deshabilitado'}.`);
}

function renderTablaAdminUsuarios() {
    document.getElementById('tbodyAdminUsuarios').innerHTML = db.usuarios.map(u => `
        <tr>
            <td>${u.idUsuario}</td>
            <td>${u.nombres} ${u.apellidos}</td>
            <td>${u.correo}</td>
            <td>${u.telefono}</td>
            <td>
                <select class="form-select form-select-sm" onchange="cambiarRolUsuario(${u.idUsuario}, this.value)" ${u.idUsuario === 1 ? 'disabled' : ''}>
                    <option value="CLIENTE" ${u.rol === 'CLIENTE' ? 'selected' : ''}>CLIENTE</option>
                    <option value="PERSONAL" ${u.rol === 'PERSONAL' ? 'selected' : ''}>PERSONAL</option>
                    <option value="ADMINISTRADOR" ${u.rol === 'ADMINISTRADOR' ? 'selected' : ''}>ADMINISTRADOR</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-${u.estado ? 'success' : 'secondary'}" onclick="toggleEstadoUsuario(${u.idUsuario})" ${u.idUsuario === 1 ? 'disabled' : ''}>
                    ${u.estado ? 'Activo' : 'Inactivo'}
                </button>
            </td>
        </tr>
    `).join('');
}

function cambiarRolUsuario(idUsuario, nuevoRol) {
    db.usuarios.find(u => u.idUsuario === idUsuario).rol = nuevoRol;
    persistirDB();
    notificar('Rol de usuario actualizado.');
}

function toggleEstadoUsuario(idUsuario) {
    const u = db.usuarios.find(x => x.idUsuario === idUsuario);
    u.estado = !u.estado;
    persistirDB();
    renderTablaAdminUsuarios();
    notificar('Estado de cuenta actualizado.');
}

// Exportar Reporte de Servicios en CSV (RF18)
function exportarReporteCSV() {
    let csv = 'ID Reserva,Cliente,Placa,Tipo Vehiculo,Servicio,Fecha,Hora,Estado Atencion,Monto (S/),Estado Pago,Metodo Pago\n';
    db.reservas.forEach(r => {
        const cli = db.usuarios.find(u => u.idUsuario === r.idUsuario) || {};
        const veh = db.vehiculos.find(v => v.idVehiculo === r.idVehiculo) || {};
        const serv = db.servicios.find(s => s.idServicio === r.idServicio) || {};
        csv += `${r.idReserva},"${cli.nombres} ${cli.apellidos}",${veh.placa},${veh.tipo},"${serv.nombre}",${r.fechaReserva},${r.horaReserva},${r.atencion.estado},${r.precioAplicado},${r.pago.estado},${r.pago.metodoPago}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_CarWash_SanJuan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    notificar('Reporte descargado en formato CSV.');
}