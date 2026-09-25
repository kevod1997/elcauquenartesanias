(function () {
  'use strict';

  var STORAGE_KEY = 'elcauquen_admin_v1';
  var MAX_FOTOS = 6;

  /* ---------- Íconos ---------- */

  var ICONO_ARRIBA = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8.5L7 4l4.5 4.5"></path></svg>';
  var ICONO_ABAJO = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 5.5L7 10l4.5-4.5"></path></svg>';
  var ICONO_IZQ = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 2.5L4 7l4.5 4.5"></path></svg>';
  var ICONO_DER = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 2.5L10 7l-4.5 4.5"></path></svg>';
  var ICONO_ESTRELLA = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1.2l1.98 4.3 4.72.55-3.5 3.24.94 4.71L8 11.7l-4.14 2.3.94-4.71-3.5-3.24 4.72-.55L8 1.2z"></path></svg>';
  var ICONO_LAPIZ = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 2l3 3-8 8-3.5 1L4 10.5 11 2z"></path></svg>';
  var ICONO_BASURA = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5l.6 8.6a1 1 0 001 .9h3.8a1 1 0 001-.9l.6-8.6"></path></svg>';
  var ICONO_X = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8"></path></svg>';
  var ICONO_FOTO = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="1.5"></rect><circle cx="7" cy="9" r="1.5"></circle><path d="M17.5 13l-4-3.5-3 2.5-2.5-2L2.5 14"></path></svg>';
  var ICONO_MAS = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M9 2.5v13M2.5 9h13"></path></svg>';

  /* ---------- Datos de ejemplo (solo si no hay nada guardado) ---------- */

  function datosDeEjemplo() {
    var catMates = { id: uid(), nombre: 'Mates' };
    var catCocina = { id: uid(), nombre: 'Cocina' };
    var tipoDiametro = { id: uid(), nombre: 'Diámetro', unidad: 'cm' };
    var tipoFija = { id: uid(), nombre: 'Fija', unidad: '' };
    var tipoAlto = { id: uid(), nombre: 'Alto', unidad: 'cm' };
    var tipoProfundidad = { id: uid(), nombre: 'Profundidad', unidad: 'cm' };
    var p1 = {
      id: uid(), nombre: 'Mate de caldén', precioCentavos: 1500000, categoriaId: catMates.id,
      descripcion: 'Madera de caldén con fleje de alpaca grabado.',
      medidas: [
        { id: uid(), tipoId: tipoDiametro.id, valor: 'interior 5' },
        { id: uid(), tipoId: tipoProfundidad.id, valor: '6' }
      ],
      galeria: [], estado: 'borrador'
    };
    var p2 = {
      id: uid(), nombre: 'Cazuelas artesanales', precioCentavos: 500000, categoriaId: catCocina.id,
      descripcion: 'Madera maciza de guayubira con terminación de alta calidad.',
      medidas: [
        { id: uid(), tipoId: tipoDiametro.id, valor: '13' },
        { id: uid(), tipoId: tipoAlto.id, valor: '4' }
      ],
      galeria: [], estado: 'borrador'
    };
    return {
      productos: [p1, p2],
      categorias: [catMates, catCocina],
      tiposMedida: [tipoDiametro, tipoFija, tipoAlto, tipoProfundidad],
      orden: [p1.id, p2.id]
    };
  }

  /* ---------- Persistencia ---------- */

  function migrar(datos) {
    if (!Array.isArray(datos.tiposMedida)) datos.tiposMedida = [];
    datos.tiposMedida.forEach(function (t) {
      if (typeof t.unidad !== 'string') t.unidad = '';
    });
    datos.productos.forEach(function (p) {
      if (!Array.isArray(p.medidas)) { p.medidas = []; return; }
      p.medidas = p.medidas.map(function (m) {
        if (typeof m === 'string') return { id: uid(), tipoId: null, valor: m };
        return m;
      });
    });
    return datos;
  }

  function cargar() {
    try {
      var crudo = localStorage.getItem(STORAGE_KEY);
      if (!crudo) return datosDeEjemplo();
      var datos = JSON.parse(crudo);
      if (!datos || !Array.isArray(datos.productos)) return datosDeEjemplo();
      return migrar(datos);
    } catch (e) {
      return datosDeEjemplo();
    }
  }

  function guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function pesos(centavos) {
    var enteros = Math.round((centavos || 0) / 100);
    return '$' + enteros.toLocaleString('es-AR');
  }

  /* ---------- Estado ---------- */

  var store = cargar();
  var ordenPendiente = store.orden.slice();
  var ordenSucio = false;

  var borrador = null;     /* copia de trabajo del producto en el modal */
  var editandoId = null;   /* null = producto nuevo */

  var editandoCategoriaId = null;   /* categoría cuyo nombre se está renombrando */
  var editandoTipoMedidaId = null;  /* tipo de medida cuyo nombre se está renombrando */
  var tipoMedidaActivo = null;      /* tipo seleccionado para la próxima medida a agregar */

  /* ---------- Referencias DOM ---------- */

  var elFilas = document.getElementById('filas');
  var elVacio = document.getElementById('vacio');
  var btnGuardarOrden = document.getElementById('btnGuardarOrden');
  var btnNuevo = document.getElementById('btnNuevo');
  var btnVacioNuevo = document.getElementById('btnVacioNuevo');

  var modal = document.getElementById('modalProducto');
  var modalError = document.getElementById('modalError');
  var fNombre = document.getElementById('fNombre');
  var fPrecio = document.getElementById('fPrecio');
  var fDescripcion = document.getElementById('fDescripcion');
  var elSelectCategoria = document.getElementById('selectCategoria');
  var formNuevaCategoria = document.getElementById('formNuevaCategoria');
  var fNuevaCategoria = document.getElementById('fNuevaCategoria');
  var linkGestionarCategorias = document.getElementById('linkGestionarCategorias');
  var formNuevoTipoMedida = document.getElementById('formNuevoTipoMedida');
  var fNuevoTipoMedida = document.getElementById('fNuevoTipoMedida');
  var fNuevoTipoMedidaUnidad = document.getElementById('fNuevoTipoMedidaUnidad');
  var linkGestionarTiposMedida = document.getElementById('linkGestionarTiposMedida');
  var elMedidas = document.getElementById('medidas');
  var elSelectTipoMedida = document.getElementById('selectTipoMedida');
  var fNuevaMedida = document.getElementById('fNuevaMedida');
  var elMedidaUnidadSufijo = document.getElementById('medidaUnidadSufijo');
  var elGaleria = document.getElementById('galeria');
  var elGaleriaContador = document.getElementById('galeriaContador');
  var fArchivo = document.getElementById('fArchivo');
  var btnEliminarProducto = document.getElementById('btnEliminarProducto');
  var btnGuardarBorrador = document.getElementById('btnGuardarBorrador');
  var btnPublicar = document.getElementById('btnPublicar');

  var modalConfirmar = document.getElementById('modalConfirmar');
  var confirmarTitulo = document.getElementById('confirmarTitulo');
  var confirmarDetalle = document.getElementById('confirmarDetalle');
  var toast = document.getElementById('toast');

  var btnConfiguracion = document.getElementById('btnConfiguracion');
  var modalConfiguracion = document.getElementById('modalConfiguracion');
  var tabCategorias = document.getElementById('tabCategorias');
  var tabTiposMedida = document.getElementById('tabTiposMedida');
  var panelCategorias = document.getElementById('panelCategorias');
  var panelTiposMedida = document.getElementById('panelTiposMedida');
  var elListaCategorias = document.getElementById('listaCategorias');
  var elCategoriasVacio = document.getElementById('categoriasVacio');
  var fNuevaCategoriaConfig = document.getElementById('fNuevaCategoriaConfig');
  var elListaTiposMedida = document.getElementById('listaTiposMedida');
  var elTiposMedidaVacio = document.getElementById('tiposMedidaVacio');
  var fNuevoTipoMedidaConfig = document.getElementById('fNuevoTipoMedidaConfig');
  var fNuevoTipoMedidaUnidadConfig = document.getElementById('fNuevoTipoMedidaUnidadConfig');

  /* ---------- Toast ---------- */

  var toastTimer = null;
  function mostrarToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- Confirmación reutilizable ---------- */

  function confirmar(titulo, detalle) {
    confirmarTitulo.textContent = titulo;
    confirmarDetalle.textContent = detalle;
    modalConfirmar.showModal();
    return new Promise(function (resolve) {
      var ok = modalConfirmar.querySelector('[data-confirmar-ok]');
      var cancelar = modalConfirmar.querySelector('[data-confirmar-cancelar]');
      function limpiar() {
        ok.removeEventListener('click', onOk);
        cancelar.removeEventListener('click', onCancelar);
        modalConfirmar.removeEventListener('cancel', onCancelar);
      }
      function onOk() { limpiar(); modalConfirmar.close(); resolve(true); }
      function onCancelar(e) { if (e) e.preventDefault(); limpiar(); modalConfirmar.close(); resolve(false); }
      ok.addEventListener('click', onOk);
      cancelar.addEventListener('click', onCancelar);
      modalConfirmar.addEventListener('cancel', onCancelar);
    });
  }

  /* ---------- Ledger ---------- */

  function productoPorId(id) {
    for (var i = 0; i < store.productos.length; i++) {
      if (store.productos[i].id === id) return store.productos[i];
    }
    return null;
  }

  function categoriaPorId(id) {
    for (var i = 0; i < store.categorias.length; i++) {
      if (store.categorias[i].id === id) return store.categorias[i];
    }
    return null;
  }

  function renderLedger() {
    elFilas.innerHTML = '';
    var hay = ordenPendiente.length > 0;
    elVacio.hidden = hay;

    ordenPendiente.forEach(function (id, i) {
      var p = productoPorId(id);
      if (!p) return;

      var fila = document.createElement('div');
      fila.className = 'fila';

      var orden = document.createElement('span');
      orden.className = 'fila__orden';
      orden.textContent = String(i + 1).padStart(2, '0');
      fila.appendChild(orden);

      var foto = document.createElement('span');
      foto.className = 'fila__foto';
      var principal = p.galeria[0];
      if (principal) {
        var img = document.createElement('img');
        img.src = principal.url;
        img.alt = '';
        img.addEventListener('error', function () { foto.innerHTML = ICONO_FOTO; });
        foto.appendChild(img);
      } else {
        foto.innerHTML = ICONO_FOTO;
      }
      fila.appendChild(foto);

      var nombre = document.createElement('div');
      nombre.className = 'fila__nombre';
      var pNombre = document.createElement('p');
      pNombre.textContent = p.nombre || 'Sin nombre';
      var cat = categoriaPorId(p.categoriaId);
      var pCat = document.createElement('span');
      pCat.textContent = cat ? cat.nombre : 'Sin categoría';
      nombre.appendChild(pNombre);
      nombre.appendChild(pCat);
      fila.appendChild(nombre);

      var precio = document.createElement('span');
      precio.className = 'fila__precio';
      precio.textContent = pesos(p.precioCentavos);
      fila.appendChild(precio);

      var estado = document.createElement('span');
      estado.className = 'fila__estado';
      var pill = document.createElement('span');
      pill.className = 'estado ' + (p.estado === 'publicado' ? 'estado--publicado' : 'estado--borrador');
      pill.textContent = p.estado === 'publicado' ? 'Publicado' : 'Borrador';
      estado.appendChild(pill);
      fila.appendChild(estado);

      var acciones = document.createElement('div');
      acciones.className = 'fila__acciones';

      var subir = botonIcono(ICONO_ARRIBA, 'Subir en el orden', function () { moverOrden(id, -1); });
      subir.disabled = i === 0;
      var bajar = botonIcono(ICONO_ABAJO, 'Bajar en el orden', function () { moverOrden(id, 1); });
      bajar.disabled = i === ordenPendiente.length - 1;
      var editar = botonIcono(ICONO_LAPIZ, 'Editar ' + p.nombre, function () { abrirModal(p.id); });
      var eliminar = botonIcono(ICONO_BASURA, 'Eliminar ' + p.nombre, function () { pedirEliminarProducto(p.id); });
      eliminar.classList.add('btn--icono-peligro');

      acciones.appendChild(subir);
      acciones.appendChild(bajar);
      acciones.appendChild(editar);
      acciones.appendChild(eliminar);
      fila.appendChild(acciones);

      elFilas.appendChild(fila);
    });
  }

  function botonIcono(svg, label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn--icono';
    b.innerHTML = svg;
    b.setAttribute('aria-label', label);
    b.title = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function moverOrden(id, direccion) {
    var i = ordenPendiente.indexOf(id);
    var j = i + direccion;
    if (j < 0 || j >= ordenPendiente.length) return;
    var tmp = ordenPendiente[i];
    ordenPendiente[i] = ordenPendiente[j];
    ordenPendiente[j] = tmp;
    ordenSucio = true;
    actualizarBotonOrden();
    renderLedger();
  }

  function actualizarBotonOrden() {
    btnGuardarOrden.disabled = !ordenSucio;
    btnGuardarOrden.setAttribute('data-dirty', ordenSucio ? 'true' : 'false');
  }

  btnGuardarOrden.addEventListener('click', function () {
    store.orden = ordenPendiente.slice();
    guardar();
    ordenSucio = false;
    actualizarBotonOrden();
    mostrarToast('Orden guardado.');
  });

  async function pedirEliminarProducto(id) {
    var p = productoPorId(id);
    if (!p) return;
    var ok = await confirmar('¿Eliminar «' + p.nombre + '»?', 'Esta acción no se puede deshacer.');
    if (!ok) return;
    store.productos = store.productos.filter(function (x) { return x.id !== id; });
    store.orden = store.orden.filter(function (x) { return x !== id; });
    ordenPendiente = ordenPendiente.filter(function (x) { return x !== id; });
    guardar();
    renderLedger();
    mostrarToast('Producto eliminado.');
  }

  /* ---------- Modal: apertura / cierre ---------- */

  function nuevoProductoVacio() {
    return {
      id: null, nombre: '', precioCentavos: 0, categoriaId: null,
      descripcion: '', medidas: [], galeria: [], estado: 'borrador'
    };
  }

  function abrirModal(id) {
    editandoId = id || null;
    var origen = id ? productoPorId(id) : null;
    borrador = origen ? JSON.parse(JSON.stringify(origen)) : nuevoProductoVacio();
    /* JSON.parse/stringify pierde los object URLs de blobs solo si no son strings;
       son strings (createObjectURL devuelve un string), así que sobreviven la copia. */

    fNombre.value = borrador.nombre;
    fPrecio.value = borrador.precioCentavos ? Math.round(borrador.precioCentavos / 100) : '';
    fDescripcion.value = borrador.descripcion || '';
    ocultarError();
    formNuevaCategoria.hidden = true;
    formNuevoTipoMedida.hidden = true;
    tipoMedidaActivo = null;
    renderSelectCategoria();
    renderMedidas();
    renderGaleria();

    btnEliminarProducto.hidden = !editandoId;
    modal.showModal();
    fNombre.focus();
  }

  function cerrarModal() {
    modal.close();
    borrador = null;
    editandoId = null;
  }

  modal.querySelectorAll('[data-cerrar]').forEach(function (b) {
    b.addEventListener('click', cerrarModal);
  });
  modal.addEventListener('cancel', function (e) { e.preventDefault(); cerrarModal(); });

  btnNuevo.addEventListener('click', function () { abrirModal(null); });
  btnVacioNuevo.addEventListener('click', function () { abrirModal(null); });

  fNombre.addEventListener('input', function () { borrador.nombre = fNombre.value; });
  fPrecio.addEventListener('input', function () {
    var n = parseInt(fPrecio.value, 10);
    borrador.precioCentavos = isNaN(n) || n < 0 ? 0 : n * 100;
  });
  fDescripcion.addEventListener('input', function () { borrador.descripcion = fDescripcion.value; });

  function mostrarError(msg) {
    modalError.textContent = msg;
    modalError.hidden = false;
  }
  function ocultarError() {
    modalError.hidden = true;
    modalError.textContent = '';
  }

  /* Input inline con foco automático, usado para renombrar categorías y tipos de medida
     en el modal de configuración. */
  function crearEditorDeChip(valorActual, etiqueta, onConfirmar, onCancelar) {
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'chip__editorInput';
    input.value = valorActual;
    input.maxLength = 40;
    input.setAttribute('aria-label', etiqueta);
    var confirmado = false;
    function confirmar_() {
      if (confirmado) return;
      confirmado = true;
      onConfirmar(input.value.trim());
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); confirmar_(); }
      else if (e.key === 'Escape') { e.preventDefault(); confirmado = true; onCancelar(); }
    });
    input.addEventListener('blur', confirmar_);
    setTimeout(function () { input.focus(); input.select(); }, 0);
    return input;
  }

  /* Editor inline de dos campos (nombre + unidad), usado para tipos de medida en el
     modal de configuración: confirma al perder foco de ambos inputs, con Enter o Escape. */
  function crearEditorTipoMedida(tipo, onConfirmar, onCancelar) {
    var wrap = document.createElement('div');
    wrap.className = 'crud-fila__editor';

    var inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.className = 'chip__editorInput';
    inputNombre.value = tipo.nombre;
    inputNombre.maxLength = 40;
    inputNombre.setAttribute('aria-label', 'Renombrar tipo de medida');

    var inputUnidad = document.createElement('input');
    inputUnidad.type = 'text';
    inputUnidad.className = 'chip__editorInput input--unidad';
    inputUnidad.value = tipo.unidad || '';
    inputUnidad.maxLength = 8;
    inputUnidad.placeholder = 'Unidad';
    inputUnidad.setAttribute('aria-label', 'Unidad del tipo de medida');

    var confirmado = false;
    function confirmar_() {
      if (confirmado) return;
      confirmado = true;
      onConfirmar(inputNombre.value.trim(), inputUnidad.value.trim());
    }
    function cancelar_() {
      if (confirmado) return;
      confirmado = true;
      onCancelar();
    }
    function alPerderFoco() {
      setTimeout(function () {
        if (document.activeElement !== inputNombre && document.activeElement !== inputUnidad) confirmar_();
      }, 0);
    }
    [inputNombre, inputUnidad].forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); confirmar_(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancelar_(); }
      });
      input.addEventListener('blur', alPerderFoco);
    });

    wrap.appendChild(inputNombre);
    wrap.appendChild(inputUnidad);
    setTimeout(function () { inputNombre.focus(); inputNombre.select(); }, 0);
    return wrap;
  }

  /* ---------- Categoría (selector único dentro del modal de producto) ---------- */

  var VALOR_CREAR_NUEVA = '__nueva__';

  function renderSelectCategoria() {
    elSelectCategoria.innerHTML = '';

    var optSin = document.createElement('option');
    optSin.value = '';
    optSin.textContent = 'Sin categoría';
    elSelectCategoria.appendChild(optSin);

    store.categorias.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.nombre;
      elSelectCategoria.appendChild(opt);
    });

    var optNueva = document.createElement('option');
    optNueva.value = VALOR_CREAR_NUEVA;
    optNueva.textContent = '+ Crear categoría nueva…';
    elSelectCategoria.appendChild(optNueva);

    elSelectCategoria.value = borrador.categoriaId || '';
  }

  elSelectCategoria.addEventListener('change', function () {
    if (elSelectCategoria.value === VALOR_CREAR_NUEVA) {
      elSelectCategoria.value = borrador.categoriaId || '';
      formNuevaCategoria.hidden = false;
      fNuevaCategoria.value = '';
      fNuevaCategoria.focus();
    } else {
      borrador.categoriaId = elSelectCategoria.value || null;
    }
  });

  document.getElementById('btnCancelarCategoria').addEventListener('click', function () {
    formNuevaCategoria.hidden = true;
  });

  document.getElementById('btnConfirmarCategoria').addEventListener('click', crearCategoriaDesdeProducto);
  fNuevaCategoria.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); crearCategoriaDesdeProducto(); }
  });

  function crearCategoriaDesdeProducto() {
    var cat = crearCategoria(fNuevaCategoria.value);
    if (!cat) return;
    borrador.categoriaId = cat.id;
    formNuevaCategoria.hidden = true;
    renderSelectCategoria();
  }

  linkGestionarCategorias.addEventListener('click', function () { abrirConfiguracion('categorias'); });

  /* ---------- Categorías: alta compartida por el selector rápido y el modal de configuración ---------- */

  function crearCategoria(nombreCrudo) {
    var nombre = (nombreCrudo || '').trim();
    if (!nombre) return null;
    var existe = store.categorias.some(function (c) { return c.nombre.toLowerCase() === nombre.toLowerCase(); });
    if (existe) {
      mostrarToast('Ya existe una categoría con ese nombre.');
      return null;
    }
    var cat = { id: uid(), nombre: nombre };
    store.categorias.push(cat);
    guardar();
    renderListaCategorias();
    renderLedger();
    return cat;
  }

  async function pedirEliminarCategoria(id) {
    var cat = categoriaPorId(id);
    if (!cat) return;
    var ok = await confirmar('¿Eliminar la categoría «' + cat.nombre + '»?', 'Los productos que la usan quedarán como "Sin categoría".');
    if (!ok) return;
    store.categorias = store.categorias.filter(function (c) { return c.id !== id; });
    store.productos.forEach(function (p) { if (p.categoriaId === id) p.categoriaId = null; });
    if (borrador && borrador.categoriaId === id) {
      borrador.categoriaId = null;
      renderSelectCategoria();
    }
    guardar();
    renderListaCategorias();
    renderLedger();
    mostrarToast('Categoría eliminada.');
  }

  function renombrarCategoria(id, nuevoNombre) {
    var existe = store.categorias.some(function (c) { return c.id !== id && c.nombre.toLowerCase() === nuevoNombre.toLowerCase(); });
    if (existe) {
      mostrarToast('Ya existe una categoría con ese nombre.');
      renderListaCategorias();
      return;
    }
    categoriaPorId(id).nombre = nuevoNombre;
    guardar();
    renderListaCategorias();
    if (borrador) renderSelectCategoria();
    renderLedger();
    mostrarToast('Categoría renombrada.');
  }

  function renderListaCategorias() {
    elListaCategorias.innerHTML = '';
    elCategoriasVacio.hidden = store.categorias.length > 0;

    store.categorias.forEach(function (cat) {
      var fila = document.createElement('div');
      fila.className = 'crud-fila';

      if (editandoCategoriaId === cat.id) {
        var editor = document.createElement('div');
        editor.className = 'crud-fila__editor';
        editor.appendChild(crearEditorDeChip(cat.nombre, 'Renombrar categoría', function (nuevo) {
          editandoCategoriaId = null;
          if (!nuevo || nuevo === cat.nombre) { renderListaCategorias(); return; }
          renombrarCategoria(cat.id, nuevo);
        }, function () {
          editandoCategoriaId = null;
          renderListaCategorias();
        }));
        fila.appendChild(editor);
        elListaCategorias.appendChild(fila);
        return;
      }

      var nombre = document.createElement('span');
      nombre.className = 'crud-fila__nombre';
      nombre.textContent = cat.nombre;

      var acciones = document.createElement('div');
      acciones.className = 'crud-fila__acciones';
      var editar = botonIcono(ICONO_LAPIZ, 'Renombrar categoría ' + cat.nombre, function () {
        editandoCategoriaId = cat.id;
        renderListaCategorias();
      });
      var eliminar = botonIcono(ICONO_BASURA, 'Eliminar categoría ' + cat.nombre, function () { pedirEliminarCategoria(cat.id); });
      eliminar.classList.add('btn--icono-peligro');
      acciones.appendChild(editar);
      acciones.appendChild(eliminar);

      fila.appendChild(nombre);
      fila.appendChild(acciones);
      elListaCategorias.appendChild(fila);
    });
  }

  fNuevaCategoriaConfig.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); crearCategoriaDesdeConfig(); }
  });
  document.getElementById('btnCrearCategoriaConfig').addEventListener('click', crearCategoriaDesdeConfig);

  function crearCategoriaDesdeConfig() {
    var cat = crearCategoria(fNuevaCategoriaConfig.value);
    if (!cat) return;
    fNuevaCategoriaConfig.value = '';
    fNuevaCategoriaConfig.focus();
    if (borrador) renderSelectCategoria();
    mostrarToast('Categoría creada.');
  }

  /* ---------- Tipos de medida (reutilizables, igual que categorías) ---------- */

  function tipoMedidaPorId(id) {
    for (var i = 0; i < store.tiposMedida.length; i++) {
      if (store.tiposMedida[i].id === id) return store.tiposMedida[i];
    }
    return null;
  }

  /* El selector decide qué tipo se va a usar para la próxima medida. Si ese tipo
     ya tiene una medida cargada, se precarga su valor: tocar «Agregar» sin
     cambiar el número no hace nada, pero si lo cambiás, sobreescribe esa medida. */
  function renderSelectTipoMedida() {
    elSelectTipoMedida.innerHTML = '';
    store.tiposMedida.forEach(function (tipo) {
      var opt = document.createElement('option');
      opt.value = tipo.id;
      opt.textContent = tipo.nombre + (tipo.unidad ? ' (' + tipo.unidad + ')' : '');
      elSelectTipoMedida.appendChild(opt);
    });

    var optNueva = document.createElement('option');
    optNueva.value = VALOR_CREAR_NUEVA;
    optNueva.textContent = '+ Crear tipo nuevo…';
    elSelectTipoMedida.appendChild(optNueva);

    if (!tipoMedidaActivo || !tipoMedidaPorId(tipoMedidaActivo)) {
      tipoMedidaActivo = store.tiposMedida.length > 0 ? store.tiposMedida[0].id : null;
    }
    elSelectTipoMedida.value = tipoMedidaActivo || VALOR_CREAR_NUEVA;
    actualizarSufijoMedida();
    sincronizarValorMedida();
  }

  elSelectTipoMedida.addEventListener('change', function () {
    if (elSelectTipoMedida.value === VALOR_CREAR_NUEVA) {
      elSelectTipoMedida.value = tipoMedidaActivo || VALOR_CREAR_NUEVA;
      formNuevoTipoMedida.hidden = false;
      fNuevoTipoMedida.value = '';
      fNuevoTipoMedidaUnidad.value = 'cm';
      fNuevoTipoMedida.focus();
    } else {
      tipoMedidaActivo = elSelectTipoMedida.value || null;
      actualizarSufijoMedida();
      sincronizarValorMedida();
    }
  });

  function actualizarSufijoMedida() {
    var tipo = tipoMedidaActivo ? tipoMedidaPorId(tipoMedidaActivo) : null;
    if (tipo && tipo.unidad) {
      elMedidaUnidadSufijo.textContent = tipo.unidad;
      elMedidaUnidadSufijo.hidden = false;
      fNuevaMedida.type = 'number';
      fNuevaMedida.min = '0';
      fNuevaMedida.step = 'any';
      fNuevaMedida.setAttribute('inputmode', 'decimal');
      fNuevaMedida.placeholder = '0';
    } else {
      elMedidaUnidadSufijo.hidden = true;
      fNuevaMedida.type = 'text';
      fNuevaMedida.removeAttribute('min');
      fNuevaMedida.removeAttribute('step');
      fNuevaMedida.removeAttribute('inputmode');
      fNuevaMedida.placeholder = 'Ej: Talla única';
    }
  }

  function sincronizarValorMedida() {
    var existente = tipoMedidaActivo && borrador.medidas.find(function (m) { return m.tipoId === tipoMedidaActivo; });
    fNuevaMedida.value = existente ? existente.valor : '';
  }

  async function pedirEliminarTipoMedida(id) {
    var tipo = tipoMedidaPorId(id);
    if (!tipo) return;
    var ok = await confirmar('¿Eliminar el tipo «' + tipo.nombre + '»?', 'Las medidas que lo usan quedarán sin tipo asignado.');
    if (!ok) return;
    store.tiposMedida = store.tiposMedida.filter(function (t) { return t.id !== id; });
    store.productos.forEach(function (p) {
      p.medidas.forEach(function (m) { if (m.tipoId === id) m.tipoId = null; });
    });
    if (borrador) {
      borrador.medidas.forEach(function (m) { if (m.tipoId === id) m.tipoId = null; });
      if (tipoMedidaActivo === id) tipoMedidaActivo = null;
      renderMedidas();
    }
    guardar();
    renderListaTiposMedida();
    mostrarToast('Tipo de medida eliminado.');
  }

  function renombrarTipoMedida(id, nuevoNombre, nuevaUnidad) {
    var existe = store.tiposMedida.some(function (t) { return t.id !== id && t.nombre.toLowerCase() === nuevoNombre.toLowerCase(); });
    if (existe) {
      mostrarToast('Ya existe un tipo de medida con ese nombre.');
      renderListaTiposMedida();
      return;
    }
    var tipo = tipoMedidaPorId(id);
    tipo.nombre = nuevoNombre;
    tipo.unidad = nuevaUnidad;
    guardar();
    renderListaTiposMedida();
    if (borrador) renderMedidas();
    mostrarToast('Tipo de medida actualizado.');
  }

  document.getElementById('btnCancelarTipoMedida').addEventListener('click', function () {
    formNuevoTipoMedida.hidden = true;
  });

  document.getElementById('btnConfirmarTipoMedida').addEventListener('click', crearTipoMedidaDesdeProducto);
  fNuevoTipoMedida.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); crearTipoMedidaDesdeProducto(); }
  });
  fNuevoTipoMedidaUnidad.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); crearTipoMedidaDesdeProducto(); }
  });

  function crearTipoMedidaDesdeProducto() {
    var tipo = crearTipoMedida(fNuevoTipoMedida.value, fNuevoTipoMedidaUnidad.value);
    if (!tipo) return;
    tipoMedidaActivo = tipo.id;
    formNuevoTipoMedida.hidden = true;
    renderSelectTipoMedida();
  }

  linkGestionarTiposMedida.addEventListener('click', function () { abrirConfiguracion('tiposMedida'); });

  /* ---------- Tipos de medida: alta compartida por el selector rápido y el modal de configuración ---------- */

  function crearTipoMedida(nombreCrudo, unidadCruda) {
    var nombre = (nombreCrudo || '').trim();
    if (!nombre) return null;
    var existe = store.tiposMedida.some(function (t) { return t.nombre.toLowerCase() === nombre.toLowerCase(); });
    if (existe) {
      mostrarToast('Ya existe un tipo de medida con ese nombre.');
      return null;
    }
    var tipo = { id: uid(), nombre: nombre, unidad: (unidadCruda || '').trim() };
    store.tiposMedida.push(tipo);
    guardar();
    renderListaTiposMedida();
    return tipo;
  }

  function renderListaTiposMedida() {
    elListaTiposMedida.innerHTML = '';
    elTiposMedidaVacio.hidden = store.tiposMedida.length > 0;

    store.tiposMedida.forEach(function (tipo) {
      var fila = document.createElement('div');
      fila.className = 'crud-fila';

      if (editandoTipoMedidaId === tipo.id) {
        var editor = crearEditorTipoMedida(tipo, function (nuevoNombre, nuevaUnidad) {
          editandoTipoMedidaId = null;
          if (!nuevoNombre) { renderListaTiposMedida(); return; }
          if (nuevoNombre === tipo.nombre && nuevaUnidad === (tipo.unidad || '')) { renderListaTiposMedida(); return; }
          renombrarTipoMedida(tipo.id, nuevoNombre, nuevaUnidad);
        }, function () {
          editandoTipoMedidaId = null;
          renderListaTiposMedida();
        });
        fila.appendChild(editor);
        elListaTiposMedida.appendChild(fila);
        return;
      }

      var nombre = document.createElement('span');
      nombre.className = 'crud-fila__nombre';
      nombre.textContent = tipo.unidad ? (tipo.nombre + ' (' + tipo.unidad + ')') : tipo.nombre;

      var acciones = document.createElement('div');
      acciones.className = 'crud-fila__acciones';
      var editar = botonIcono(ICONO_LAPIZ, 'Renombrar tipo ' + tipo.nombre, function () {
        editandoTipoMedidaId = tipo.id;
        renderListaTiposMedida();
      });
      var eliminar = botonIcono(ICONO_BASURA, 'Eliminar tipo ' + tipo.nombre, function () { pedirEliminarTipoMedida(tipo.id); });
      eliminar.classList.add('btn--icono-peligro');
      acciones.appendChild(editar);
      acciones.appendChild(eliminar);

      fila.appendChild(nombre);
      fila.appendChild(acciones);
      elListaTiposMedida.appendChild(fila);
    });
  }

  fNuevoTipoMedidaConfig.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); crearTipoMedidaDesdeConfig(); }
  });
  fNuevoTipoMedidaUnidadConfig.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); crearTipoMedidaDesdeConfig(); }
  });
  document.getElementById('btnCrearTipoMedidaConfig').addEventListener('click', crearTipoMedidaDesdeConfig);

  function crearTipoMedidaDesdeConfig() {
    var tipo = crearTipoMedida(fNuevoTipoMedidaConfig.value, fNuevoTipoMedidaUnidadConfig.value);
    if (!tipo) return;
    fNuevoTipoMedidaConfig.value = '';
    fNuevoTipoMedidaUnidadConfig.value = 'cm';
    fNuevoTipoMedidaConfig.focus();
    if (borrador) renderSelectTipoMedida();
    mostrarToast('Tipo de medida creado.');
  }

  /* ---------- Modal de configuración (categorías y tipos de medida) ---------- */

  function mostrarTabConfiguracion(tab) {
    var esCategorias = tab === 'categorias';
    tabCategorias.setAttribute('aria-selected', esCategorias ? 'true' : 'false');
    tabTiposMedida.setAttribute('aria-selected', esCategorias ? 'false' : 'true');
    panelCategorias.hidden = !esCategorias;
    panelTiposMedida.hidden = esCategorias;
  }

  function abrirConfiguracion(tab) {
    editandoCategoriaId = null;
    editandoTipoMedidaId = null;
    fNuevaCategoriaConfig.value = '';
    fNuevoTipoMedidaConfig.value = '';
    fNuevoTipoMedidaUnidadConfig.value = 'cm';
    mostrarTabConfiguracion(tab || 'categorias');
    renderListaCategorias();
    renderListaTiposMedida();
    modalConfiguracion.showModal();
  }

  tabCategorias.addEventListener('click', function () { mostrarTabConfiguracion('categorias'); });
  tabTiposMedida.addEventListener('click', function () { mostrarTabConfiguracion('tiposMedida'); });
  btnConfiguracion.addEventListener('click', function () { abrirConfiguracion('categorias'); });

  modalConfiguracion.querySelectorAll('[data-cerrar]').forEach(function (b) {
    b.addEventListener('click', function () { modalConfiguracion.close(); });
  });
  modalConfiguracion.addEventListener('cancel', function (e) { e.preventDefault(); modalConfiguracion.close(); });

  /* ---------- Medidas ---------- */

  function renderMedidas() {
    elMedidas.innerHTML = '';
    borrador.medidas.forEach(function (m, i) {
      var chip = document.createElement('span');
      chip.className = 'chip';
      var tipo = m.tipoId ? tipoMedidaPorId(m.tipoId) : null;
      var etiqueta = tipo ? (tipo.nombre + ': ' + m.valor + (tipo.unidad ? ' ' + tipo.unidad : '')) : m.valor;
      var texto = document.createElement('span');
      texto.textContent = etiqueta;
      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'chip__quitar';
      quitar.innerHTML = ICONO_X;
      quitar.setAttribute('aria-label', 'Quitar medida ' + etiqueta);
      quitar.addEventListener('click', function () {
        borrador.medidas.splice(i, 1);
        renderMedidas();
      });
      chip.appendChild(texto);
      chip.appendChild(quitar);
      elMedidas.appendChild(chip);
    });
    renderSelectTipoMedida();
  }

  document.getElementById('btnAgregarMedida').addEventListener('click', agregarMedida);
  fNuevaMedida.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); agregarMedida(); }
  });

  function agregarMedida() {
    if (!tipoMedidaActivo) {
      mostrarToast('Creá un tipo de medida primero.');
      return;
    }
    var v = fNuevaMedida.value.trim();
    if (!v) return;

    var existente = borrador.medidas.find(function (m) { return m.tipoId === tipoMedidaActivo; });
    if (existente) {
      if (existente.valor === v) {
        mostrarToast('Esa medida ya está cargada. Cambiá el número para actualizarla.');
        return;
      }
      existente.valor = v;
      mostrarToast('Medida actualizada.');
    } else {
      borrador.medidas.push({ id: uid(), tipoId: tipoMedidaActivo, valor: v });
      var siguienteLibre = store.tiposMedida.find(function (t) {
        return t.id !== tipoMedidaActivo && !borrador.medidas.some(function (m) { return m.tipoId === t.id; });
      });
      if (siguienteLibre) tipoMedidaActivo = siguienteLibre.id;
    }
    renderMedidas();
    fNuevaMedida.focus();
  }

  /* ---------- Galería ---------- */

  function normalizarGaleria() {
    var g = borrador.galeria;
    if (g.length > 0 && g[0].esDiseno) {
      var j = -1;
      for (var i = 1; i < g.length; i++) { if (!g[i].esDiseno) { j = i; break; } }
      if (j > -1) {
        var item = g.splice(j, 1)[0];
        g.unshift(item);
      }
    }
  }

  function renderGaleria() {
    elGaleria.innerHTML = '';
    elGaleriaContador.textContent = '(' + borrador.galeria.length + '/' + MAX_FOTOS + ')';

    borrador.galeria.forEach(function (foto, i) {
      var esPrincipal = i === 0 && !foto.esDiseno;
      var card = document.createElement('div');
      card.className = 'foto';

      var marco = document.createElement('div');
      marco.className = 'foto__marco';
      var img = document.createElement('img');
      img.src = foto.url;
      img.alt = '';
      marco.appendChild(img);
      if (esPrincipal) {
        var badge = document.createElement('span');
        badge.className = 'foto__badge';
        badge.textContent = 'Principal';
        marco.appendChild(badge);
      } else if (foto.esDiseno) {
        var badgeD = document.createElement('span');
        badgeD.className = 'foto__badge';
        badgeD.textContent = 'Diseño';
        marco.appendChild(badgeD);
      }
      card.appendChild(marco);

      var controles = document.createElement('div');
      controles.className = 'foto__controles';

      var filaMover = document.createElement('div');
      filaMover.className = 'foto__fila';
      var izq = botonIcono(ICONO_IZQ, 'Mover antes', function () { moverFoto(i, -1); });
      izq.disabled = i <= 1;
      var der = botonIcono(ICONO_DER, 'Mover después', function () { moverFoto(i, 1); });
      der.disabled = i === 0 || i === borrador.galeria.length - 1;
      var principalBtn = botonIcono(ICONO_ESTRELLA, 'Marcar como principal', function () { marcarPrincipal(i); });
      principalBtn.disabled = foto.esDiseno || esPrincipal;
      filaMover.appendChild(izq);
      filaMover.appendChild(der);
      filaMover.appendChild(principalBtn);
      controles.appendChild(filaMover);

      var diseno = document.createElement('label');
      diseno.className = 'foto__diseno';
      var check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = foto.esDiseno;
      check.addEventListener('change', function () { toggleDiseno(i, check.checked); });
      diseno.appendChild(check);
      diseno.appendChild(document.createTextNode('Es un diseño'));
      controles.appendChild(diseno);

      if (foto.esDiseno) {
        var nombreDiseno = document.createElement('input');
        nombreDiseno.type = 'text';
        nombreDiseno.placeholder = 'Nombre del diseño (opcional)';
        nombreDiseno.maxLength = 40;
        nombreDiseno.value = foto.nombreDiseno || '';
        nombreDiseno.addEventListener('input', function () { foto.nombreDiseno = nombreDiseno.value; });
        controles.appendChild(nombreDiseno);
      }

      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'btn btn--peligro';
      quitar.style.padding = '6px 10px';
      quitar.style.fontSize = '12px';
      quitar.textContent = 'Quitar';
      quitar.addEventListener('click', function () { quitarFoto(i); });
      controles.appendChild(quitar);

      card.appendChild(controles);
      elGaleria.appendChild(card);
    });

    if (borrador.galeria.length < MAX_FOTOS) {
      var agregar = document.createElement('button');
      agregar.type = 'button';
      agregar.className = 'foto foto--agregar';
      agregar.innerHTML = ICONO_MAS + '<span>Agregar foto</span>';
      agregar.addEventListener('click', function () { fArchivo.click(); });
      elGaleria.appendChild(agregar);
    }
  }

  fArchivo.addEventListener('change', function () {
    var archivos = Array.prototype.slice.call(fArchivo.files || []);
    archivos.forEach(function (file) {
      if (borrador.galeria.length >= MAX_FOTOS) return;
      /* Carga simulada: preview local instantánea, se trata como ya procesada. */
      borrador.galeria.push({ id: uid(), url: URL.createObjectURL(file), esDiseno: false, nombreDiseno: '' });
    });
    fArchivo.value = '';
    renderGaleria();
  });

  function moverFoto(i, direccion) {
    var j = i + direccion;
    if (j < 0 || j >= borrador.galeria.length) return;
    if (i === 0 || j === 0) {
      mostrarToast('La imagen principal no se mueve: marcá otra foto como principal para reemplazarla.');
      return;
    }
    var tmp = borrador.galeria[i];
    borrador.galeria[i] = borrador.galeria[j];
    borrador.galeria[j] = tmp;
    renderGaleria();
  }

  function marcarPrincipal(i) {
    if (borrador.galeria[i].esDiseno) return;
    var item = borrador.galeria.splice(i, 1)[0];
    borrador.galeria.unshift(item);
    renderGaleria();
  }

  function toggleDiseno(i, valor) {
    if (i === 0 && valor) {
      mostrarToast('La imagen principal no puede ser un diseño. Marcá otra foto como principal primero.');
      renderGaleria();
      return;
    }
    borrador.galeria[i].esDiseno = valor;
    if (!valor) borrador.galeria[i].nombreDiseno = '';
    renderGaleria();
  }

  function quitarFoto(i) {
    borrador.galeria.splice(i, 1);
    normalizarGaleria();
    renderGaleria();
  }

  /* ---------- Guardado del producto ---------- */

  function validarDatosBasicos() {
    if (!borrador.nombre.trim()) return 'El nombre es obligatorio.';
    if (!borrador.precioCentavos || borrador.precioCentavos <= 0) return 'El precio es obligatorio.';
    return null;
  }

  function commitProducto(nuevoEstado) {
    borrador.estado = nuevoEstado;
    if (editandoId) {
      var idx = store.productos.findIndex(function (p) { return p.id === editandoId; });
      borrador.id = editandoId;
      store.productos[idx] = borrador;
    } else {
      borrador.id = uid();
      store.productos.push(borrador);
      store.orden.push(borrador.id);
      ordenPendiente.push(borrador.id);
    }
    guardar();
  }

  btnGuardarBorrador.addEventListener('click', function () {
    var error = validarDatosBasicos();
    if (error) { mostrarError(error); return; }
    commitProducto('borrador');
    renderLedger();
    mostrarToast('Guardado como borrador.');
    cerrarModal();
  });

  btnPublicar.addEventListener('click', function () {
    var error = validarDatosBasicos();
    if (error) { mostrarError(error); return; }
    if (borrador.galeria.length === 0 || borrador.galeria[0].esDiseno) {
      mostrarError('Para publicar hace falta al menos una foto que no sea un diseño. El producto queda a salvo como borrador.');
      commitProducto('borrador');
      renderLedger();
      return;
    }
    commitProducto('publicado');
    renderLedger();
    mostrarToast('Producto publicado.');
    cerrarModal();
  });

  btnEliminarProducto.addEventListener('click', async function () {
    if (!editandoId) return;
    var p = productoPorId(editandoId);
    var ok = await confirmar('¿Eliminar «' + p.nombre + '»?', 'Esta acción no se puede deshacer.');
    if (!ok) return;
    store.productos = store.productos.filter(function (x) { return x.id !== editandoId; });
    store.orden = store.orden.filter(function (x) { return x !== editandoId; });
    ordenPendiente = ordenPendiente.filter(function (x) { return x !== editandoId; });
    guardar();
    cerrarModal();
    renderLedger();
    mostrarToast('Producto eliminado.');
  });

  /* ---------- Arranque ---------- */

  actualizarBotonOrden();
  renderLedger();
})();
