// Inicializar datos en localStorage para funcionamiento 100% en GitHub Pages
const serviciosDefault = [
    { id: 1, nombre: 'Lavado Básico Exterior', descripcion: 'Lavado con shampoo neutro, limpieza de aros y secado con microfibra.', precio: 25, duracion: 30 },
    { id: 2, nombre: 'Lavado Salón Completo', descripcion: 'Lavado exterior, aspirado profundo interior, limpieza de tablero y aromatizado.', precio: 45, duracion: 60 },
    { id: 3, nombre: 'Lavado de Motor y Chasis', descripcion: 'Desengrase de motor con vapor controlado y lavado a presión de chasis.', precio: 55, duracion: 50 },
    { id: 4, nombre: 'Cambio de Aceite + Filtro (Repsol/Mobil)', descripcion: 'Mantenimiento preventivo con lubricantes originales y revisión de niveles.', precio: 120, duracion: 45 }
];

const usuariosDefault = [
    { correo: 'admin@carwashsanjuan.com', clave: 'admin123', nombres: 'Admin San Juan', rol: 'ADMINISTRADOR' }
];

let servicios = JSON.parse(localStorage.getItem('cw_servicios')) || serviciosDefault;
let usuarios = JSON.parse(localStorage.getItem('cw_usuarios')) || usuariosDefault;
let vehiculos = JSON.parse(localStorage.getItem('cw_vehiculos')) || [];
let reservas = JSON.parse(localStorage.getItem('cw_reservas')) || [];
let sesion = JSON.parse(localStorage.getItem('cw_sesion')) || null;

function guardarDatos() {
    localStorage.setItem('cw_servicios', JSON.stringify(servicios));
    localStorage.setItem('cw_usuarios', JSON.stringify(usuarios));
    localStorage.setItem('cw_vehiculos', JSON.stringify(vehiculos));
    localStorage.setItem('cw_reservas', JSON.stringify(reservas));
    localStorage.setItem('cw_sesion', JSON.stringify(sesion));
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('rFecha').min = new Date().toISOString().split('T')[0];
    actualizarUI();
    renderServicios();
});

function actualizarUI() {
    if (!sesion) return;
    document.getElementById('zonaAuth').innerHTML = `
        <span class="navbar-text text-white me-2 small">Hola, <strong>${sesion.nombres}</strong> (${sesion.rol})</span>
        <button class="btn btn-outline-danger btn-sm" onclick="logout()">Salir</button>
    `;
    document.getElementById('btnHeroReservar').removeAttribute('data-bs-toggle');
    document.getElementById('btnHeroReservar').onclick = () => location.href = sesion.rol === 'CLIENTE' ? '#panelUsuario' : '#panelAdmin';

    if (sesion.rol === 'CLIENTE') {
        document.getElementById('navReservas').classList.remove('d-none');
        document.getElementById('panelUsuario').classList.remove('d-none');
        renderVehiculos();
        renderReservas();
    } else {
        document.getElementById('navAdmin').classList.remove('d-none');
        document.getElementById('panelAdmin').classList.remove('d-none');
        document.getElementById('btnNuevoServicio').classList.remove('d-none');
        renderReservas();
    }
}

function renderServicios() {
    const cont = document.getElementById('listaServicios');
    const sel = document.getElementById('rServicio');
    cont.innerHTML = ''; sel.innerHTML = '';
    servicios.forEach(s => {
        cont.innerHTML += `
            <div class="col-md-3">
                <div class="card card-servicio h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between mb-2">
                            <h6 class="fw-bold mb-0">${s.nombre}</h6>
                            <span class="badge bg-primary">S/ ${Number(s.precio).toFixed(2)}</span>
                        </div>
                        <p class="text-muted small flex-grow-1">${s.descripcion}</p>
                        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                            <small class="text-secondary"><i class="bi bi-clock"></i> ${s.duracion} min</small>
                            ${sesion?.rol === 'ADMINISTRADOR' ? `<button class="btn btn-outline-danger btn-sm" onclick="borrarServicio(${s.id})"><i class="bi bi-trash"></i></button>` : ''}
                        </div>
                    </div>
                </div>
            </div>`;
        sel.innerHTML += `<option value="${s.id}">${s.nombre} - S/ ${Number(s.precio).toFixed(2)}</option>`;
    });
}

document.getElementById('formRegistro').onsubmit = e => {
    e.preventDefault();
    const correo = document.getElementById('regCorreo').value;
    if (usuarios.some(u => u.correo === correo)) return alert('Este correo ya existe.');
    usuarios.push({ nombres: document.getElementById('regNombres').value, correo, clave: document.getElementById('regClave').value, rol: 'CLIENTE' });
    guardarDatos();
    alert('Cuenta creada. Ahora inicia sesión.');
    bootstrap.Modal.getInstance(document.getElementById('modalRegistro')).hide();
};

document.getElementById('formLogin').onsubmit = e => {
    e.preventDefault();
    const user = usuarios.find(u => u.correo === document.getElementById('loginCorreo').value && u.clave === document.getElementById('loginClave').value);
    if (!user) return alert('Credenciales incorrectas.');
    sesion = user;
    guardarDatos();
    location.reload();
};

function logout() { sesion = null; guardarDatos(); location.reload(); }

document.getElementById('formVehiculo').onsubmit = e => {
    e.preventDefault();
    vehiculos.push({ id: Date.now(), cliente: sesion.correo, placa: document.getElementById('vPlaca').value.toUpperCase(), marca: document.getElementById('vMarca').value, modelo: document.getElementById('vModelo').value });
    guardarDatos(); e.target.reset(); renderVehiculos();
};

function renderVehiculos() {
    const misV = vehiculos.filter(v => v.cliente === sesion.correo);
    document.getElementById('rVehiculo').innerHTML = misV.length
        ? misV.map(v => `<option value="${v.placa} (${v.marca} ${v.modelo})">${v.placa} - ${v.marca} ${v.modelo}</option>`).join('')
        : '<option value="">Registre un vehículo primero</option>';
}

document.getElementById('formReserva').onsubmit = e => {
    e.preventDefault();
    const serv = servicios.find(s => s.id == document.getElementById('rServicio').value);
    reservas.push({
        id: Date.now(), cliente: sesion.nombres, correo: sesion.correo,
        vehiculo: document.getElementById('rVehiculo').value, servicio: serv.nombre, precio: serv.precio,
        fecha: document.getElementById('rFecha').value, hora: document.getElementById('rHora').value,
        metodoPago: document.getElementById('rMetodoPago').value, estado: 'EN ESPERA', pago: 'PENDIENTE'
    });
    guardarDatos(); e.target.reset(); renderReservas(); alert('Reserva confirmada.');
};

function renderReservas() {
    if (sesion.rol === 'CLIENTE') {
        const misR = reservas.filter(r => r.correo === sesion.correo);
        document.getElementById('tablaReservasCliente').innerHTML = misR.map(r => `
            <tr>
                <td>${r.fecha} ${r.hora}</td><td><strong>${r.vehiculo}</strong></td>
                <td>${r.servicio}<br><strong>S/ ${Number(r.precio).toFixed(2)}</strong></td>
                <td><span class="badge bg-primary">${r.estado}</span></td>
                <td><span class="badge ${r.pago === 'PAGADO' ? 'bg-success' : 'bg-warning text-dark'}">${r.pago}</span></td>
                <td>${r.estado === 'EN ESPERA' ? `<button class="btn btn-outline-danger btn-sm" onclick="cancelarRes(${r.id})">Cancelar</button>` : '-'}</td>
            </tr>`).join('');
    } else {
        const total = reservas.filter(r => r.pago === 'PAGADO').reduce((a, b) => a + Number(b.precio), 0);
        document.getElementById('resumenKPI').textContent = `Atenciones: ${reservas.length} | Recaudado: S/ ${total.toFixed(2)}`;
        document.getElementById('tablaAdmin').innerHTML = reservas.map((r, i) => `
            <tr>
                <td>#${i + 1}</td><td>${r.cliente}</td><td>${r.vehiculo}</td>
                <td>${r.servicio}<br><strong>S/ ${Number(r.precio).toFixed(2)}</strong></td><td>${r.fecha} ${r.hora}</td>
                <td>
                    <select class="form-select form-select-sm" onchange="cambiarEstado(${r.id}, this.value)">
                        <option ${r.estado === 'EN ESPERA' ? 'selected' : ''}>EN ESPERA</option>
                        <option ${r.estado === 'EN LAVADO' ? 'selected' : ''}>EN LAVADO</option>
                        <option ${r.estado === 'FINALIZADO' ? 'selected' : ''}>FINALIZADO</option>
                    </select>
                </td>
                <td>${r.pago === 'PAGADO' ? '<span class="badge bg-success">PAGADO</span>' : `<button class="btn btn-success btn-sm" onclick="cobrar(${r.id})">Cobrar</button>`}</td>
            </tr>`).join('');
    }
}

function cancelarRes(id) { reservas = reservas.filter(r => r.id !== id); guardarDatos(); renderReservas(); }
function cambiarEstado(id, est) { reservas.find(r => r.id === id).estado = est; guardarDatos(); renderReservas(); }
function cobrar(id) { reservas.find(r => r.id === id).pago = 'PAGADO'; guardarDatos(); renderReservas(); }
function borrarServicio(id) { servicios = servicios.filter(s => s.id !== id); guardarDatos(); renderServicios(); }

document.getElementById('formServicio').onsubmit = e => {
    e.preventDefault();
    servicios.push({ id: Date.now(), nombre: document.getElementById('sNombre').value, descripcion: document.getElementById('sDescripcion').value, precio: document.getElementById('sPrecio').value, duracion: document.getElementById('sDuracion').value });
    guardarDatos(); e.target.reset(); bootstrap.Modal.getInstance(document.getElementById('modalServicio')).hide(); renderServicios();
};