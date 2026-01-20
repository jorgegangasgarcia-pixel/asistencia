const mensaje = document.getElementById('mensaje');
const lista = document.getElementById('listaRegistros');
const rutInput = document.getElementById('rut');

const tipos = {
  entrada: '🟢 Entrada',
  e_almuerzo: '🍽️ E-Almuerzo',
  s_almuerzo: '☕ S-Almuerzo',
  salida: '🔴 Salida'
};

// ---------------- MARCAR ASISTENCIA ----------------
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value.trim();
    const rut = rutInput.value.trim().toUpperCase();
    const tipo = btn.dataset.tipo;

    if (!nombre || !rut) {
      mensaje.innerText = '⚠️ Ingresa nombre y RUT';
      return;
    }

    // Validación RUT sin puntos
    const rutValido = /^0*(\d{1,8}-[K\d])$/.test(rut);
    if (!rutValido) {
      mensaje.innerText = '⚠️ RUT inválido. Ejemplo: 20967629-K';
      return;
    }

    const res = await fetch('/marcar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, rut, tipo })
    });

    const data = await res.json();
    if (data.ok) {
      mensaje.innerText = data.mensaje || '✅ Registro guardado';
      cargarRegistros(rut);
    } else {
      mensaje.innerText = '❌ Error al guardar';
    }
  });
});

// ---------------- CARGAR HISTORIAL ----------------
async function cargarRegistros(rut) {
  if (!rut) return;
  const res = await fetch(`/registros/${rut}`);
  const datos = await res.json();

  lista.innerHTML = '';
  if (datos.length === 0) {
    lista.innerHTML = '<li>No hay registros</li>';
    return;
  }

  datos.forEach(r => {
    const li = document.createElement('li');
    li.classList.add('registro', r.tipo);
    li.innerHTML = `
      <div class="tipo">${tipos[r.tipo]}</div>
      <div class="hora">🕒 ${new Date(r.hora).toLocaleString('es-CL')}</div>
    `;
    lista.appendChild(li);
  });
}

// ---------------- LOGIN ADMIN ----------------
const btnAdmin = document.getElementById('btnAdmin');
const modalAdmin = document.getElementById('modalAdmin');
const cerrarModal = document.getElementById('cerrarModal');
const loginAdmin = document.getElementById('loginAdmin');
const passwordAdmin = document.getElementById('passwordAdmin');
const errorAdmin = document.getElementById('errorAdmin');

const PASS_ADMIN = "123456"; // <- aquí pones tu contraseña

btnAdmin.addEventListener('click', () => {
  modalAdmin.style.display = 'block';
});

cerrarModal.addEventListener('click', () => {
  modalAdmin.style.display = 'none';
  errorAdmin.innerText = '';
  passwordAdmin.value = '';
});

loginAdmin.addEventListener('click', () => {
  if (passwordAdmin.value === PASS_ADMIN) {
    window.location.href = "/admin.html";
  } else {
    errorAdmin.innerText = "❌ Contraseña incorrecta";
  }
});

// Cerrar modal si se hace click afuera
window.addEventListener('click', (e) => {
  if (e.target == modalAdmin) {
    modalAdmin.style.display = "none";
    errorAdmin.innerText = '';
    passwordAdmin.value = '';
  }
});
