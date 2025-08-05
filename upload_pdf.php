<?php
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pdf_data'])) {
    $pdfData = $_POST['pdf_data'];
    $filename = $_POST['filename'] ?? 'factura_' . uniqid() . '.pdf'; // Usar filename si se provee, sino generar uno
    
    // Eliminar el prefijo data URI si existe (e.g., "data:application/pdf;base64,")
    $pdfData = str_replace('data:application/pdf;base64,', '', $pdfData);
    
    $decodedPdf = base64_decode($pdfData);
    
    $uploadDir = 'assets/invoices/';
    $filePath = $uploadDir . basename($filename);

    // Asegurarse de que el directorio de carga existe
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (file_put_contents($filePath, $decodedPdf)) {
        // Asumir que el script está en la raíz de ferreteria/
        $fileUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]/ferreteria/" . $filePath;
        $response['success'] = true;
        $response['message'] = 'PDF subido exitosamente';
        $response['url'] = $fileUrl;
    } else {
        $response['message'] = 'Error al guardar el archivo PDF en el servidor.';
    }
} else {
    $response['message'] = 'Solicitud inválida o datos de PDF faltantes.';
}

echo json_encode($response);
?> 