// Variable para almacenar el estado del carrito
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
const countProducts = document.querySelector('.count-products');

// Actualiza el contador del carrito en el navbar
 
function actualizarContadorCarrito() {
    const totalProductos = carrito.reduce((sum, item) => sum + item.quantity, 0);
    countProducts.innerText = totalProductos;
}
// Renderiza dinámicamente la lista de productos con cantidad disponible e input

function renderizarProductos() {
    const container = document.getElementById('products-container'); // Busca el contairner con el id products-container en HTML de inicio
    container.innerHTML = '';
    // se empiezan a recorrer los productos de array productos
    productos.forEach(producto => {
        const card = document.createElement('div'); // se crea un div que contendra la informacion del producto
        card.classList.add('col-md-4', 'mb-4');
        
        card.innerHTML = `
            <div class="card" data-product-id="${producto.id}">
                <img src="${producto.imagen}" class="card-img-top product-img" alt="${producto.nombre}">
                <div class="card-body">
                    <h5 class="card-title">${producto.nombre}</h5>
                    <p class="price" style="font-size: 1.3em; color: #28a745; font-weight: bold;">$${producto.precio.toFixed(2)}</p>
                    <p style="color: #666; font-size: 0.9em;">
                        <strong>Disponibles:</strong> <span class="stock-disponible">${producto.cantidadDisponible}</span>
                    </p>
                    <div class="mb-3">
                        <label for="cantidad-${producto.id}" class="form-label">Cantidad:</label>
                        <input type="number" class="form-control cantidad-input" id="cantidad-${producto.id}" 
                               min="1" max="${producto.cantidadDisponible}" value="1">
                    </div>
                    <button class="btn btn-primary w-100 add-to-cart" data-product-id="${producto.id}">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    agregarEventListeners();
}
 
// Abre el modal de detalle para un producto
    
    function openProductModal(productId) {
        const producto = productos.find(p => p.id === productId);
        if (!producto) return;

        document.getElementById('modal-product-image').src = producto.imagen;
        document.getElementById('modal-product-title').innerText = producto.nombre;
        document.getElementById('modal-product-price').innerText = `$${producto.precio.toFixed(2)}`;
        document.getElementById('modal-product-desc').innerText = `Disponibilidad total: ${producto.cantidadDisponible}`;

        const sizeSelect = document.getElementById('modal-size-select');
        sizeSelect.innerHTML = '';
        Object.keys(producto.tallaStock).forEach(size => {
            const opt = document.createElement('option');
            opt.value = size;
            opt.innerText = `${size} (${producto.tallaStock[size]} disp.)`;
            sizeSelect.appendChild(opt);
        });

        // actualizar disponibilidad al cambiar version
        function updateAvailable() {
            const selected = sizeSelect.value;
            const avail = producto.tallaStock[selected] || 0;
            document.getElementById('modal-available').innerText = avail;
            const qty = document.getElementById('modal-quantity');
            qty.max = avail;
            if (parseInt(qty.value) > avail) qty.value = avail || 1;
        }

        sizeSelect.addEventListener('change', updateAvailable);
        updateAvailable();

        // botón agregar desde modal
        const modalAddBtn = document.getElementById('modal-add-to-cart');
        // remover listeners previos
        const newBtn = modalAddBtn.cloneNode(true);
        modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);
        newBtn.addEventListener('click', () => {
            const selectedSize = document.getElementById('modal-size-select').value;
            const cantidad = parseInt(document.getElementById('modal-quantity').value) || 1;

            const available = producto.tallaStock[selectedSize] || 0;
            if (cantidad < 1 || cantidad > available) {
                Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: `Hay ${available} unidades disponibles del articulo ${selectedSize}` });
                return;
            }

            // verificar si ya existe combinación id+size
            const existing = carrito.find(i => i.id === producto.id && i.size === selectedSize);
            if (existing) {
                if (existing.quantity + cantidad > available) {
                    Swal.fire({ icon: 'warning', title: 'Stock insuficiente', text: `No puedes agregar más de ${available} unidades del articulo ${selectedSize}` });
                    return;
                }
                existing.quantity += cantidad;
            } else {
                carrito.push({ id: producto.id, title: producto.nombre, price: producto.precio, image: producto.imagen, quantity: cantidad, size: selectedSize });
            }

            localStorage.setItem('carrito', JSON.stringify(carrito));
            actualizarContadorCarrito();
            // cerrar modal
            const modalEl = document.getElementById('productDetailModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();

            Swal.fire({ icon: 'success', title: 'Añadido', text: `${cantidad} × ${producto.nombre} (Version ${selectedSize}) añadido al carrito`, timer: 1400, showConfirmButton: false });
        });

        // mostrar modal
        const modalEl = document.getElementById('productDetailModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }


 // Detecta cambios de cantidad para validar contra stock disponible
 
function agregarEventListeners() {
    const botonesAgregar = document.querySelectorAll('.add-to-cart');
    
    botonesAgregar.forEach(btn => {
        btn.addEventListener('click', agregarAlCarrito);
    });

    // Abrir modal al hacer click en la imagen o título
    const productCards = document.querySelectorAll('.card');
    productCards.forEach(card => {
        const id = card.dataset.productId;
        const img = card.querySelector('.card-img-top');
        const title = card.querySelector('.card-title');
        if (img) img.addEventListener('click', () => openProductModal(id));
        if (title) title.addEventListener('click', () => openProductModal(id));
    });

    // Validar cantidad máxima
    const inputsCantidad = document.querySelectorAll('.cantidad-input');
    inputsCantidad.forEach(input => {
        input.addEventListener('change', function() {
            const max = parseInt(this.max);
            const value = parseInt(this.value);
            
            if (value > max) {
                this.value = max;
            }
            if (value < 1) {
                this.value = 1;
            }
        });
    });
}

 // Agrega producto al carrito con validaciones
 // @param {Event} e - Evento del click
 
function agregarAlCarrito(e) {
    const productId = this.dataset.productId;
    const producto = productos.find(p => p.id === productId);
    const inputCantidad = document.getElementById(`cantidad-${productId}`);
    const cantidadSolicitada = parseInt(inputCantidad.value);

    // Validación 1: Verificar que la cantidad sea válida
    if (isNaN(cantidadSolicitada) || cantidadSolicitada < 1) {
        Swal.fire({
            icon: 'error',
            title: 'Cantidad inválida',
            text: 'Por favor ingresa una cantidad válida (mínimo 1)',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    // Validación 2: Verificar stock disponible
    if (cantidadSolicitada > producto.cantidadDisponible) {
        Swal.fire({
            icon: 'warning',
            title: 'Stock insuficiente',
            text: `Solo hay ${producto.cantidadDisponible} unidades disponibles`,
            confirmButtonText: 'Entendido'
        });
        return;
    }

    // Verificar si el producto ya está en el carrito
    const existingProduct = carrito.find(item => item.id === productId);

    if (existingProduct) {
        // Si ya existe, aumentar cantidad
        const nuevaCantidad = existingProduct.quantity + cantidadSolicitada;
        
        if (nuevaCantidad > producto.cantidadDisponible) {
            Swal.fire({
                icon: 'warning',
                title: 'Stock insuficiente',
                text: `Solo hay ${producto.cantidadDisponible} unidades disponibles en total`,
                confirmButtonText: 'Entendido'
            });
            return;
        }
        
        existingProduct.quantity = nuevaCantidad;
    } else {
        // Crear nuevo producto en el carrito
        carrito.push({
            id: productId,
            title: producto.nombre,
            price: producto.precio,
            image: producto.imagen,
            quantity: cantidadSolicitada
        });
    }

    // Guardar carrito en localStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();

    // Reiniciar input de cantidad
    inputCantidad.value = 1;

    // Mostrar alerta de éxito
    Swal.fire({
        icon: 'success',
        title: '¡Producto agregado!',
        text: `${cantidadSolicitada} ${cantidadSolicitada > 1 ? 'unidades' : 'unidad'} de ${producto.nombre} añadidas al carrito.`,
        showConfirmButton: false,
        timer: 1500
    });
}

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    renderizarProductos();
    actualizarContadorCarrito();
});



