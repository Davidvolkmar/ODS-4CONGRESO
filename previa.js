// Versión previa (antes de la apertura): la misma animación de carga y el mismo menú de inicio de la experiencia,
// sin el bosque 3D. En lugar de "Iniciar experiencia" muestra cuándo abre, con una cuenta regresiva.
// Se publica desde DIST-PREVIA/ (npm run build:previa) y se reemplaza por la versión completa (dist/) al abrir.
import '../src/styles.css';
import './previa.css';
import museo from '../muestra/museo.json';

const APERTURA = new Date('2026-10-28T08:00:00-05:00'); // 28 de octubre, 8:00 a. m. (hora de Colombia)
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- carga: el aro avanza mientras se arma la rueda
const fondo = new Image();
fondo.src = 'fondo-bosque.jpg';
const fondoListo = (fondo.decode ? fondo.decode() : Promise.resolve()).catch(() => {});
const mensajes = ['Sembrando el bosque…', 'Tendiendo la cinta del recorrido…', 'Colgando los pósteres…', 'Afinando la Corona de las Voces…'];
const t0 = window.__introInicio || performance.now();
const DURACION = 4400;
const arco = $('#intro-arco'), texto = $('#carga-texto');
const avanzar = () => {
  const t = Math.min(1, (performance.now() - t0) / DURACION);
  arco?.style.setProperty('stroke-dashoffset', String(295.3 * (1 - t)));
  if (texto) texto.textContent = t < 1 ? mensajes[Math.min(mensajes.length - 1, Math.floor(t * mensajes.length))] : 'Muy pronto';
  if (t < 1) requestAnimationFrame(avanzar);
};
requestAnimationFrame(avanzar);

Promise.all([fondoListo, document.fonts?.ready, new Promise((r) => setTimeout(r, Math.max(0, DURACION + 200 - (performance.now() - t0))))]).then(() => {
  $('.previa-fondo').style.backgroundImage = `url("${fondo.src}")`;
  $('#intro').classList.add('listo');
  setTimeout(abrirMenu, 900);
  setTimeout(() => $('#intro')?.remove(), 1500);
});

// ---------------------------------------------------------------- menú con el aviso de apertura
/** Tiempo que falta para la apertura, en días, horas, minutos y segundos. */
function cuenta() {
  const ms = Math.max(0, APERTURA - Date.now());
  const s = Math.floor(ms / 1000);
  return { abierta: ms <= 0, dias: Math.floor(s / 86400), horas: Math.floor((s % 86400) / 3600), minutos: Math.floor((s % 3600) / 60), segundos: s % 60 };
}

function abrirMenu() {
  const el = $('#menu-inicio');
  const conv = museo.convocatoria || {};
  const fechas = (conv.calendario || []).slice(1).map((c) => `${c.fecha}: ${c.evento}`).join(' · ');
  const salas = (museo.orden_salas || []).map((id) => museo.salas[id]).filter(Boolean);
  el.innerHTML = `
    <div class="menu-panel">
      <div class="menu-logo" aria-hidden="true"></div>
      <p class="menu-ante">${esc(museo.museo)}</p>
      <h1>Objetivos de<br>Desarrollo Sostenible</h1>
      <p class="menu-tema">${esc(museo.tema)}</p>
      <p class="menu-meta">Cinco arquitecturas escondidas en un bosque · un solo recorrido · conferencias en vivo${fechas ? `<br><span>${esc(fechas)}</span>` : ''}</p>
      <div class="previa-aviso" role="status">
        <b>Esta experiencia abre el 28 de octubre de 2026</b>
        <div class="contador" aria-label="Cuenta regresiva para la apertura">
          ${[['dias', 'días'], ['horas', 'horas'], ['minutos', 'min'], ['segundos', 'seg']].map(([k, et]) => `<div class="caja" data-k="${k}"><span class="num">--</span><small>${et}</small></div>`).join('<i class="sep">:</i>')}
        </div>
        <small>Ese día podrás recorrer el bosque virtual, leer y escuchar los pósteres de las cinco dimensiones y seguir las conferencias en vivo desde la Corona de las Voces.</small>
      </div>
      <button class="menu-primario" disabled aria-disabled="true">Iniciar experiencia · 28 de octubre</button>
      <div class="menu-secundarios">
        ${conv.pagina ? `<a href="${esc(conv.pagina)}" target="_blank" rel="noopener">Información del congreso ↗</a>` : ''}
        <button data-m="encontrar" aria-expanded="false">Qué encontrarás</button>
      </div>
      <div class="menu-controles previa-salas" hidden>
        <ul>${salas.map((s) => `<li><span class="punto" style="background:${s.color}"></span><b>Sala ${esc(s.numero)} · ${esc(s.nombre_corto)}</b> <small>${esc(s.encontrar || s.dimension || '')}</small></li>`).join('')}
          <li><span class="punto" style="background:${museo.corona?.color || '#6a4c93'}"></span><b>Sala VI · ${esc(museo.corona?.nombre_corto || 'La Corona de las Voces')}</b> <small>conferencias en vivo sobre el dosel</small></li></ul>
      </div>
    </div>
    <p class="credito menu-credito">experiencia virtual hecha por <span>David Volkmar Velez</span></p>`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('visible'));
  // el contador corre cada segundo; cada número que cambia da un pequeño salto
  const previos = {};
  const pintar = () => {
    const c = cuenta();
    for (const k of ['dias', 'horas', 'minutos', 'segundos']) {
      const v = String(c[k]).padStart(2, '0');
      if (previos[k] === v) continue;
      previos[k] = v;
      const num = el.querySelector(`.caja[data-k="${k}"] .num`);
      num.textContent = v;
      num.classList.remove('tic');
      void num.offsetWidth; // reinicia la animación
      num.classList.add('tic');
    }
    if (c.abierta) {
      el.querySelector('.contador').classList.add('cero');
      el.querySelector('.previa-aviso small').textContent = 'Estamos abriendo las puertas del bosque: si todavía ves este aviso, vuelve a cargar la página en unos minutos.';
    }
  };
  pintar();
  setInterval(pintar, 1000);
  el.querySelector('[data-m="encontrar"]').addEventListener('click', (e) => {
    const lista = el.querySelector('.previa-salas');
    lista.hidden = !lista.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!lista.hidden));
  });
}
