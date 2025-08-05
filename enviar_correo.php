<?php
header('Content-Type: application/json');

// Verificar si es una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Obtener y validar los datos del formulario
$nombre = filter_input(INPUT_POST, 'nombreContacto', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'emailContacto', FILTER_SANITIZE_EMAIL);
$tipoConsulta = filter_input(INPUT_POST, 'tipoConsulta', FILTER_SANITIZE_STRING);
$mensaje = filter_input(INPUT_POST, 'mensajeContacto', FILTER_SANITIZE_STRING);

// Validar que todos los campos estén presentes
if (!$nombre || !$email || !$tipoConsulta || !$mensaje) {
    echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
    exit;
}

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}

// Configurar el correo
$to = 'hectorturcios46@gmail.com';
$subject = "Consulta de $tipoConsulta de $nombre";
$headers = "From: $email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Preparar el cuerpo del mensaje
$messageBody = "Nombre: $nombre\n";
$messageBody .= "Email: $email\n";
$messageBody .= "Tipo de Consulta: $tipoConsulta\n\n";
$messageBody .= "Mensaje:\n$mensaje";

// Intentar enviar el correo y capturar errores
try {
    $mailSent = mail($to, $subject, $messageBody, $headers);
    
    if ($mailSent) {
        echo json_encode(['success' => true, 'message' => 'Datos enviados con éxito']);
    } else {
        $error = error_get_last();
        echo json_encode([
            'success' => false, 
            'message' => 'Error al enviar el mensaje',
            'debug' => [
                'error' => $error,
                'mail_config' => [
                    'to' => $to,
                    'subject' => $subject,
                    'headers' => $headers
                ]
            ]
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Error al enviar el mensaje',
        'debug' => [
            'exception' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?> 