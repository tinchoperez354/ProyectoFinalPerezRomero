/*
  ProyectoFinalPerezRomero - app.js
  Simulador Ecommerce: carga productos desde JSON, genera HTML desde JS,
  permite agregar al carrito, editar cantidades, simular checkout con formulario (SweetAlert2),
  y guarda carrito en localStorage para persistencia.
*/

// ----- Estado y utilidades ----- //
const API_PRODUCTS = 'products.json'; // carga asíncrona simulada
const STORAGE_KEY = 'pp_cart';
let products = []; // array de productos (objetos)
let cart = []; // array de {id, qty}

// Formateador de moneda simple (ARS)
function formatCurrency(amount){ return '$' + Number(amount).toLocaleString('es-AR'); }

// Cargar datos remotos (JSON)
async function loadProducts(){
  try {
    const res = await fetch(API_PRODUCTS);
    products = await res.json();
    renderProducts();
  } catch (err) {
    Swal.fire({icon:'error', title:'Error', text:'No se pudieron cargar los productos.'});
  }
}

// Guardar y cargar carrito (persistencia)
function saveCart(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); updateUI(); }
function loadCart(){ const raw = localStorage.getItem(STORAGE_KEY); cart = raw ? JSON.parse(raw) : []; updateUI(); }

// Buscar producto por id
function findProduct(id){ return products.find(p => p.id === id); }

// ----- Renderizado dinámico ----- //
function renderProducts(){
  const list = document.getElementById('product-list');
  list.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3 class="product-title">${p.name}</h3>
      <p class="product-desc">${p.description}</p>
      <div class="product-price">${formatCurrency(p.price)}</div>
      <div>Stock: ${p.stock}</div>
      <div style="margin-top:.5rem;display:flex;gap:.5rem;align-items:center">
        <input type="number" min="1" max="${p.stock}" value="1" aria-label="cantidad-${p.id}" style="width:70px;padding:.4rem;border-radius:6px;border:1px solid #ddd" />
        <button class="btn add-btn">Agregar</button>
      </div>
    `;
    // evento agregar
    const btn = card.querySelector('.add-btn');
    btn.addEventListener('click', () => {
      const qtyInput = card.querySelector('input');
      const qty = Math.max(1, Math.min(p.stock, Number(qtyInput.value) || 1));
      addToCart(p.id, qty);
      qtyInput.value = 1;
      // feedback visual con SweetAlert2 (no usar alert/prompt)
      Swal.fire({toast:true, position:'top-end', icon:'success', title:`Agregados ${qty} x ${p.name}`, showConfirmButton:false, timer:1200});
    });
    list.appendChild(card);
  });
}

// Render del carrito
function updateUI(){
  const cartSummary = document.getElementById('cart-summary');
  const cartItems = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Calculos
  let subtotal = 0, totalQty = 0;
  cartItems.innerHTML = '';
  cart.forEach(item => {
    const prod = findProduct(item.id);
    if (!prod) return;
    subtotal += prod.price * item.qty;
    totalQty += item.qty;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div style="flex:1">
        <strong>${prod.name}</strong><div style="font-size:.9rem;color:#666">${formatCurrency(prod.price)} x ${item.qty}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem">
        <input type="number" min="1" max="${prod.stock}" value="${item.qty}" data-id="${item.id}" style="width:70px;padding:.25rem;border-radius:6px;border:1px solid #ddd" />
        <button class="btn secondary remove-btn" data-id="${item.id}">Eliminar</button>
      </div>
    `;
    cartItems.appendChild(div);

    // input cantidad
    const qtyInput = div.querySelector('input');
    qtyInput.addEventListener('change', (e) => {
      const newQty = Math.max(1, Math.min(prod.stock, Number(e.target.value) || 1));
      updateQuantity(item.id, newQty);
    });
    // eliminar
    const rem = div.querySelector('.remove-btn');
    rem.addEventListener('click', () => {
      removeFromCart(item.id);
    });
  });

  const shipping = subtotal > 10000 || subtotal === 0 ? 0 : 500; // regla simple
  const total = subtotal + shipping;

  cartSummary.textContent = `Carrito: ${totalQty} items - ${formatCurrency(total)}`;
  subtotalEl.textContent = formatCurrency(subtotal);
  shippingEl.textContent = formatCurrency(shipping);
  totalEl.textContent = formatCurrency(total);

  checkoutBtn.disabled = cart.length === 0;
}

// ----- Operaciones del carrito (con funciones parametrizadas) ----- //
function addToCart(id, qty = 1){
  // encuentra item y suma o crea nuevo
  const existing = cart.find(i => i.id === id);
  const prod = findProduct(id);
  if (!prod) return;
  if (existing){
    const newQty = Math.min(prod.stock, existing.qty + qty);
    existing.qty = newQty;
  } else {
    cart.push({id, qty: Math.min(prod.stock, qty)});
  }
  saveCart();
}

function updateQuantity(id, qty){
  const prod = findProduct(id);
  if (!prod) return;
  cart = cart.map(i => i.id === id ? {...i, qty: Math.min(prod.stock, qty)} : i);
  saveCart();
}

function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function clearCart(){
  cart = [];
  saveCart();
}

// ----- Checkout (simula flujo completo) ----- //
async function openCheckoutForm(){
  if (cart.length === 0){
    Swal.fire({icon:'info', title:'Carrito vacío', text:'Agrega productos antes de finalizar.'});
    return;
  }

  // Form template cloned
  const tpl = document.getElementById('checkout-form-template');
  const formHtml = tpl.innerHTML;

  const { value: formValues } = await Swal.fire({
    title: 'Completar datos de compra',
    html: formHtml,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      const form = Swal.getPopup().querySelector('#checkout-form');
      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        dni: form.dni.value.trim(),
        address: form.address.value.trim(),
        payment: form.payment.value
      };
      if (!data.name || !data.email || !data.dni || !data.address || !data.payment) {
        Swal.showValidationMessage('Completa todos los campos');
        return false;
      }
      return data;
    }
  });

  if (!formValues) return; // cancelado

  // Simular procesamiento (ej. stock update, pago)
  const order = processOrder(formValues);
  // Resultado al usuario
  await Swal.fire({
    icon: 'success',
    title: 'Compra realizada',
    html: `<strong>Gracias ${order.name}!</strong><p>Orden #${order.orderId} - Total ${formatCurrency(order.total)}</p>`
  });

  // vaciar carrito al finalizar
  clearCart();
}

// Procesa la orden: valida stock, decrementa (simulado) y devuelve resumen
function processOrder(buyer){
  // validar stock
  const failed = cart.find(item => {
    const prod = findProduct(item.id);
    return !prod || item.qty > prod.stock;
  });
  if (failed){
    Swal.fire({icon:'error', title:'Stock insuficiente', text:'Actualiza el carrito.'});
    throw new Error('stock');
  }

  // decrementar stock local (simulación)
  cart.forEach(it => {
    const prod = findProduct(it.id);
    prod.stock = Math.max(0, prod.stock - it.qty);
  });

  // calcular totales
  const subtotal = cart.reduce((s,it) => s + findProduct(it.id).price * it.qty, 0);
  const shipping = subtotal > 10000 || subtotal === 0 ? 0 : 500;
  const total = subtotal + shipping;

  // generar id simple
  const orderId = 'PP-' + Date.now();

  // devolver resumen
  return {...buyer, orderId, subtotal, shipping, total, items: [...cart]};
}

// ----- Eventos globales y boot ----- //
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadCart();

  document.getElementById('checkout-btn').addEventListener('click', openCheckoutForm);
  document.getElementById('clear-cart').addEventListener('click', () => {
    Swal.fire({
      title: '¿Vaciar carrito?',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar',
      icon: 'warning'
    }).then(res => {
      if (res.isConfirmed) clearCart();
    });
  });

  document.getElementById('preload-btn').addEventListener('click', () => {
    // Pre-cargar datos en formulario: ejemplo de sugerencia del enunciado
    Swal.fire({
      title: 'Precarga datos en el formulario',
      html: '<p>Se precargarán datos de ejemplo al abrir el formulario.</p>',
      icon: 'info'
    }).then(() => {
      // open with prefilled values
      const tpl = document.getElementById('checkout-form-template');
      // after open we will set values by custom prefill flow
      const formHtml = tpl.innerHTML;
      Swal.fire({
        title: 'Completar datos de compra (precargado)',
        html: formHtml,
        focusConfirm: false,
        showCancelButton: true,
        didOpen: () => {
          const f = Swal.getPopup().querySelector('#checkout-form');
          f.name.value = 'Martin Perez Romero';
          f.email.value = 'martin@example.com';
          f.dni.value = '12345678';
          f.address.value = 'Córdoba, Argentina';
          f.payment.value = 'mercado';
        },
        preConfirm: () => {
          const form = Swal.getPopup().querySelector('#checkout-form');
          const data = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            dni: form.dni.value.trim(),
            address: form.address.value.trim(),
            payment: form.payment.value
          };
          if (!data.name || !data.email || !data.dni || !data.address || !data.payment) {
            Swal.showValidationMessage('Completa todos los campos');
            return false;
          }
          return data;
        }
      }).then(result => {
        if (result.value) {
          const order = processOrder(result.value);
          Swal.fire({icon:'success', title:'Compra precargada', html:`Orden #${order.orderId} - Total ${formatCurrency(order.total)}`});
          clearCart();
        }
      });
    });
  });

  document.getElementById('demo-purchase').addEventListener('click', () => {
    // Añadir primer producto y simular checkout rápido
    if (products.length > 0){
      addToCart(products[0].id, 1);
      openCheckoutForm();
    }
  });
});
