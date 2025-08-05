// Estado global del carrito
let carrito = {
    items: [],
    total: 0
};

// Función para agregar producto al carrito
function agregarAlCarrito(productId) {
    console.log('Intentando agregar producto ID:', productId);
    console.log('Productos disponibles:', window.allProducts);
    
    const producto = window.allProducts.find(p => p.id === productId);

    if (!producto) {
        console.error('Producto no encontrado:', productId);
        mostrarNotificacion('Error: Producto no encontrado.', 'error');
        return;
    }

    console.log('Producto encontrado:', producto);

    // Convertir el precio a número si viene como string con formato "L.XX.XX"
    const precio = typeof producto.precio === 'string' 
        ? parseFloat(producto.precio.replace('L.', '')) 
        : producto.precio;

    console.log('Precio procesado:', precio);

    const itemExistente = carrito.items.find(item => item.id === producto.id);
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
        console.log('Cantidad actualizada para producto existente:', itemExistente);
    } else {
        const nuevoItem = {
            id: producto.id,
            nombre: producto.nombre,
            precio: precio,
            cantidad: 1,
            imagen: producto.imagen
        };
        carrito.items.push(nuevoItem);
        console.log('Nuevo item agregado:', nuevoItem);
    }
    
    actualizarCarrito();
    mostrarNotificacion(`${producto.nombre} agregado al carrito`);
    
    // La visibilidad del mini-carrito se controla en scripts.js/mostrarSeccion o manejarVisibilidadMiniCarrito()
    if (typeof manejarVisibilidadMiniCarrito !== 'undefined') {
        manejarVisibilidadMiniCarrito();
    }
}

// Función para actualizar el carrito (renderizar contenido y actualizar contadores)
function actualizarCarrito() {
    console.log('actualizarCarrito llamado. Estado del carrito:', carrito.items, 'Total:', carrito.total);
    const carritoContainerMini = document.getElementById('carrito-container'); // Mini-carrito
    const totalElementMini = document.getElementById('carrito-total'); // Mini-carrito
    const carritoContainerModal = document.getElementById('modal-carrito-container'); // Modal del carrito
    const totalElementModal = document.getElementById('modal-carrito-total'); // Modal del carrito
    const cartCountFlotante = document.getElementById('cart-count');
    const miniCartCount = document.getElementById('mini-cart-count');

    // Limpiar ambos contenedores
    if (carritoContainerMini) {
        carritoContainerMini.innerHTML = '';
    }
    if (carritoContainerModal) {
        carritoContainerModal.innerHTML = '';
    }
    
    carrito.total = 0;

    if (carrito.items.length === 0) {
        const emptyMessage = '<p class="w3-center">El carrito está vacío.</p>';
        if (carritoContainerMini) {
            carritoContainerMini.innerHTML = emptyMessage;
        }
        if (carritoContainerModal) {
            carritoContainerModal.innerHTML = emptyMessage;
        }
    }

    carrito.items.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        carrito.total += subtotal;
        
        const itemHTML = `
            <img src="${item.imagen}" alt="${item.nombre}" class="carrito-item-imagen">
            <div class="carrito-item-detalles">
                <h4>${item.nombre}</h4>
                <p>Precio: L.${item.precio.toFixed(2)}</p>
                <div class="carrito-item-cantidad">
                    <button onclick="actualizarCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                    <span>${item.cantidad}</span>
                    <button onclick="actualizarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                </div>
                <p>Subtotal: L.${subtotal.toFixed(2)}</p>
            </div>
            <button onclick="eliminarDelCarrito(${item.id})" class="eliminar-item">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Crear elemento para el mini-carrito
        if (carritoContainerMini) {
            const itemElementMini = document.createElement('div');
            itemElementMini.className = 'carrito-item';
            itemElementMini.innerHTML = itemHTML;
            carritoContainerMini.appendChild(itemElementMini);
        }

        // Crear elemento para el modal del carrito
        if (carritoContainerModal) {
            const itemElementModal = document.createElement('div');
            itemElementModal.className = 'carrito-item';
            itemElementModal.innerHTML = itemHTML;
            carritoContainerModal.appendChild(itemElementModal);
        }
    });
    
    // Actualizar el total en ambos lugares
    if (totalElementMini) {
        totalElementMini.textContent = `L.${carrito.total.toFixed(2)}`;
    }
    if (totalElementModal) {
        totalElementModal.textContent = `Total: L.${carrito.total.toFixed(2)}`;
    }

    const currentCartCount = carrito.items.reduce((total, item) => total + item.cantidad, 0);

    // Actualizar el contador del botón flotante
    if (cartCountFlotante) {
        cartCountFlotante.textContent = currentCartCount;
    }

    // Actualizar el contador de la pestaña del mini-carrito
    if (miniCartCount) {
        miniCartCount.textContent = currentCartCount;
    }

    // La visibilidad del mini-carrito se controla en scripts.js/mostrarSeccion o manejarVisibilidadMiniCarrito()
}

// Función para actualizar la cantidad de un item
function actualizarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(id);
        return;
    }
    
    const item = carrito.items.find(item => item.id === id);
    if (item) {
        item.cantidad = nuevaCantidad;
        actualizarCarrito();
    }
}

// Función para eliminar un item del carrito
function eliminarDelCarrito(id) {
    carrito.items = carrito.items.filter(item => item.id !== id);
    actualizarCarrito();
    mostrarNotificacion('Producto eliminado del carrito');
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    
    // Añadir clase basada en el tipo de notificación
    if (tipo === 'success') {
        notificacion.classList.add('notificacion-success');
        notificacion.innerHTML = '<i class="fas fa-check-circle w3-margin-right"></i>' + mensaje;
    } else if (tipo === 'error') {
        notificacion.classList.add('notificacion-error');
        notificacion.innerHTML = '<i class="fas fa-exclamation-circle w3-margin-right"></i>' + mensaje;
    } else {
        notificacion.classList.add('notificacion-info');
        notificacion.innerHTML = '<i class="fas fa-info-circle w3-margin-right"></i>' + mensaje;
    }
    
    document.body.appendChild(notificacion);
    
    // Para la animación de entrada
    setTimeout(() => {
        notificacion.style.opacity = '1';
        notificacion.style.transform = 'translateX(0)';
    }, 10);

    // Para la animación de salida
    setTimeout(() => {
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateX(100%)';
        notificacion.addEventListener('transitionend', () => notificacion.remove());
    }, 3000); // 3 segundos antes de empezar a desvanecer
}

// Función para generar la factura
function generarFactura() {
    console.log('Generando factura. Estado actual del carrito:', carrito);
    
    if (carrito.items.length === 0) {
        console.log('Carrito vacío, no se puede generar factura');
        mostrarNotificacion('El carrito está vacío', 'error');
        return;
    }
    
    // Ocultar la vista del carrito y mostrar la selección de pago
    document.getElementById('modal-carrito-view').style.display = 'none';
    document.getElementById('payment-selection').style.display = 'block';
    document.getElementById('online-payment-form').style.display = 'none';
}

// Nueva función para mostrar la selección de pago (para el botón 'Volver')
function mostrarSeleccionPago() {
    document.getElementById('modal-carrito-view').style.display = 'none';
    document.getElementById('payment-selection').style.display = 'block';
    document.getElementById('online-payment-form').style.display = 'none';
}

// Nueva función para seleccionar el método de pago
function seleccionarMetodoPago(metodo) {
    const fecha = new Date().toLocaleDateString();
    const numeroFactura = 'FACT-' + Date.now().toString().slice(-6);

    if (metodo === 'entrega') {
        const emailBodyContent = `
Estimado cliente,

Gracias por su compra en ForgeLine. Aquí está el detalle de su factura con PAGO AL ENTREGAR:

Número de Factura: ${numeroFactura}
Fecha: ${fecha}

Productos:
${carrito.items.map(item => `- ${item.nombre} (x${item.cantidad}) - L.${item.precio.toFixed(2)} c/u - Subtotal: L.${(item.precio * item.cantidad).toFixed(2)}`).join('\n')}

Total de la factura: L.${carrito.total.toFixed(2)}

Su pedido será procesado para pago al momento de la entrega.

Atentamente,
El equipo de ForgeLine
`;
        enviarFacturaPorCorreo(emailBodyContent, numeroFactura);
        finalizarCompra();
    } else if (metodo === 'online') {
        // Ocultar selección de pago y mostrar formulario de pago en línea
        document.getElementById('payment-selection').style.display = 'none';
        document.getElementById('online-payment-form').style.display = 'block';
    }
}

// Nueva función para procesar el pago en línea (de prueba)
function procesarPagoEnLinea() {
    const cardNumber = document.getElementById('card-number').value.trim();
    const cardName = document.getElementById('card-name').value.trim();
    const cardExpiry = document.getElementById('card-expiry').value.trim();
    const cardCVC = document.getElementById('card-cvc').value.trim();

    if (!cardNumber || !cardName || !cardExpiry || !cardCVC) {
        mostrarNotificacion('Por favor, rellena todos los campos de pago.', 'error');
        return;
    }

    // Simular el envío de la factura con pago en línea
    const fecha = new Date().toLocaleDateString();
    const numeroFactura = 'FACT-' + Date.now().toString().slice(-6);

    const emailBodyContent = `
Estimado cliente,

Gracias por su compra en ForgeLine. Aquí está el detalle de su factura con PAGO EN LÍNEA (PRUEBA):

Número de Factura: ${numeroFactura}
Fecha: ${fecha}

Productos:
${carrito.items.map(item => `- ${item.nombre} (x${item.cantidad}) - L.${item.precio.toFixed(2)} c/u - Subtotal: L.${(item.precio * item.cantidad).toFixed(2)}`).join('\n')}

Total de la factura: L.${carrito.total.toFixed(2)}

Su pago en línea ha sido recibido y su pedido está siendo procesado.

Atentamente,
El equipo de ForgeLine
`;

    enviarFacturaPorCorreo(emailBodyContent, numeroFactura);
    mostrarNotificacion('Pago en línea procesado con éxito. Factura enviada.', 'success');
    finalizarCompra();
}

// Nueva función para finalizar la compra (cerrar modal, limpiar carrito)
function finalizarCompra() {
    // Cerrar el modal del carrito
    document.getElementById('carrito-modal').style.display = 'none';

    // Restablecer la vista del modal del carrito a la vista inicial (ítems + total)
    document.getElementById('modal-carrito-view').style.display = 'block';
    document.getElementById('payment-selection').style.display = 'none';
    document.getElementById('online-payment-form').style.display = 'none';

    // Limpiar el carrito
    carrito.items = [];
    carrito.total = 0;
    actualizarCarrito(); // Para que el contador del carrito se actualice a 0
    
    // Asegurarse de que el mini-carrito se oculte si no hay ítems
    if (typeof manejarVisibilidadMiniCarrito !== 'undefined') {
        manejarVisibilidadMiniCarrito();
    }

    // Opcional: navegar a la sección de productos o inicio si es necesario
    // Por ahora, solo se cierra el modal y se limpia el carrito
}

// Función para enviar la factura por correo
function enviarFacturaPorCorreo(emailBodyText, numeroFactura) {
    console.log('Preparando envío de factura:', numeroFactura);
    console.log('Contenido a enviar:', emailBodyText);
    
    // Crear un nuevo FormData
    const formData = new FormData();
    
    // Limpiar el texto de posibles caracteres especiales
    const cleanText = emailBodyText.trim().replace(/\r\n/g, '\n');
    
    // Agregar los campos necesarios para FormSubmit
    formData.append('email', 'hectorturcios46@gmail.com'); // Email de destino
    formData.append('_subject', `Factura ForgeLine - #${numeroFactura}`);
    formData.append('message', cleanText); // Usar 'message' en lugar de '_text'
    formData.append('_captcha', 'false');
    
    console.log('FormData preparado:', Object.fromEntries(formData));
    
    // Realizar la petición a FormSubmit
    fetch('https://formsubmit.co/ajax/hectorturcios46@gmail.com', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(formData)
    })
    .then(response => {
        console.log('Respuesta recibida:', response);
        return response.json();
    })
    .then(data => {
        console.log('Datos de respuesta:', data);
        if (data.success) {
            mostrarNotificacion('Factura enviada exitosamente al correo.', 'success');
            // Limpiar el carrito después de enviar la factura
            carrito.items = [];
            actualizarCarrito();
        } else {
            console.error('Error en FormSubmit:', data);
            mostrarNotificacion('Error al enviar la factura. Intenta de nuevo.', 'error');
        }
    })
    .catch(error => {
        console.error('Error en la petición:', error);
        mostrarNotificacion('Error al enviar la factura. Verifica tu conexión.', 'error');
    });
} 
