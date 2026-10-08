/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import ProductService, { Product } from "../../src/product_service";

const TABLE_NAME = process.env.TABLE_NAME ?? "";
// Singleton para evitar reinstanciar el cliente en cada invocación de Lambda
const dynamoService = new ProductService(TABLE_NAME);

// Interface para validar el cuerpo de entrada (Request Body)
interface ImportationRequestBody {
  factura_led?: number;
  factura_conectores?: number;
  metros_led?: number;
  metros_por_rollo?: number;
  cantidad_conectores?: number;
  seguro?: number;
  envio_barco?: number;
  total_pagado_servicio?: number;
  precio_venta_rollo?: number;
  precio_venta_conector?: number;
  numero_pedido?: number;
}

export const landedCostCalculatorFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);

  try {
    // 1. Validar y parsear el Body del API Gateway
    if (!event.body) {
      return response(400, { message: "El cuerpo de la solicitud (body) es requerido" });
    }

    const data: ImportationRequestBody = JSON.parse(event.body);

    // 2. Extraer valores del negocio o asignar los valores por defecto de tu caso real
    const facturaLed = redondearADosDecimales(data.factura_led ?? 0);
    const facturaConectores = redondearADosDecimales(data.factura_conectores ?? 0);
    const metrosLed = data.metros_led ?? 2000;
    const metrosPorRollo = data.metros_por_rollo ?? 10;
    const cantidadConectores = data.cantidad_conectores ?? 1000;
    const seguro = redondearADosDecimales(data.seguro ?? 0);
    const envioBarco = redondearADosDecimales(data.envio_barco ?? 0);
    const totalPagadoServicio = redondearADosDecimales(data.total_pagado_servicio ?? 0);
    const precioVentaRollo = redondearADosDecimales(data.precio_venta_rollo ?? 0);
    const precioVentaConector = redondearADosDecimales(data.precio_venta_conector ?? 0);
    const numeroPedido =  redondearADosDecimales(data.numero_pedido ?? 0)

    // 3. Lógica matemática de distribución proporcional de costos
                                //1040 + 186 = 1226
    const totalFacturaOriginal = redondearADosDecimales(facturaLed + facturaConectores); 

                                //1393 - 1226 = 167
    const comisionServicio = redondearADosDecimales(totalPagadoServicio - totalFacturaOriginal);

                              //37 + 109 + 167 = 313
    const gastosExtraTotales = redondearADosDecimales(seguro + envioBarco + comisionServicio); 

                          //1040 / 1226 = 0.85
    const porcentajeLed = redondearADosDecimales(facturaLed / totalFacturaOriginal);

                                    //186 / 1226 = 0.15
    const porcentajeConectores = redondearADosDecimales(facturaConectores / totalFacturaOriginal);

                    //313 * 0.85 = 266.05
    const gastosLed = redondearADosDecimales(gastosExtraTotales * porcentajeLed); // esto te da lo que tiene que asumir las luces de los gastos extras 

                    // 313 * 0.15 = 46.95
    const gastosConectores = redondearADosDecimales(gastosExtraTotales * porcentajeConectores); // lo que tiene que asumir los conectores de los gastos extras

                      // 1040 + 266.05 = 1306.05
    const costoTotalLed = redondearADosDecimales(facturaLed + gastosLed);

                      // 186 + 46.95 = 232.95
    const costoTotalConectores = redondearADosDecimales(facturaConectores + gastosConectores);
    
    // 4. Costos unitarios finales calculados
                      //2000 / 10 = 200
    const totalRollos = metrosLed / metrosPorRollo;
                              // 1306.05 / 2000 * 10 = 6.53
    const costoUnitarioRollo = redondearADosDecimales((costoTotalLed / metrosLed) * metrosPorRollo);
                            // 232.95 / 1000 = 0.23
    const costoUnitarioConector = redondearADosDecimales(costoTotalConectores / cantidadConectores);

    // 5. Cálculos de ingresos totales (Ventas)
    const ingresoTotalLed = redondearADosDecimales(totalRollos * precioVentaRollo); // 200 * 15 = 3000 USD
    const ingresoTotalConectores = redondearADosDecimales(cantidadConectores * precioVentaConector); // 1000 * 0.45 = 450 USD
    const ingresosTotalesGlobales = redondearADosDecimales(ingresoTotalLed + ingresoTotalConectores); // 3450 USD

     // 6. CÁLCULO DE LA GANANCIA BRUTA
                                            // 15 - 6.53 = 8.47 USD
    const gananciaBrutaPorRollo = redondearADosDecimales(precioVentaRollo - costoUnitarioRollo); 
                                        // 0.45 - 0.23 = 0.22 USD
    const gananciaBrutaPorConector = redondearADosDecimales(precioVentaConector - costoUnitarioConector); 

                                //200 * 8.47 = 1,694
    const gananciaBrutaTotalLed = redondearADosDecimales(totalRollos * gananciaBrutaPorRollo); // 1,694.51 USD

                                        //1000 * 0.22 = 220
    const gananciaBrutaTotalConectores = redondearADosDecimales(cantidadConectores * gananciaBrutaPorConector); 

                                // 1,694 + 220= 1,914
    const gananciaBrutaGlobal = redondearADosDecimales(gananciaBrutaTotalLed + gananciaBrutaTotalConectores); 

    // 7. Márgenes de ganancia sobre costo
                      // 8.47 / 6.53 * 100 = 129.7%
    const margenLed = redondearADosDecimales((gananciaBrutaPorRollo / costoUnitarioRollo) * 100);
                      // 0.22 / 0.23 * 100 = 95.65%
    const margenConector = redondearADosDecimales((gananciaBrutaPorConector / costoUnitarioConector) * 100);

    const fechaIso = new Date().toISOString();

    // 6. Mapear al modelo estricto de DynamoDB: Entidad Luces LED (en Rollos)
    const itemLed: Product = {
      id: `PROD#LED#${numeroPedido}`,
      nombre: `Luces LED Rollo ${metrosPorRollo}M`,
      facturaLed,
      metrosLed,
      metrosPorRollo,
      seguro,
      envioBarco,
      totalPagadoServicio,
      precioVentaRollo,
      totalFacturaOriginal,
      comisionServicio,
      gastosExtraTotales,
      porcentajeLed,
      gastosLed,
      costoTotalLed,
      totalRollos,
      costoUnitarioRollo,
      ingresoTotalLed,
      ingresosTotalesGlobales,
      gananciaBrutaPorRollo,
      gananciaBrutaTotalLed,
      gananciaBrutaGlobal,
      margenLed,
      fechaCreacion: fechaIso,
      ultimaActualizacion: fechaIso
    };

    // 7. Mapear al modelo estricto de DynamoDB: Entidad Conectores
    const itemConector: Product = {
      id: `PROD#CONECTOR#${numeroPedido}`,
      nombre: `Conectores ${cantidadConectores}`,
      facturaConectores,
      cantidadConectores,
      seguro,
      envioBarco,
      totalPagadoServicio,
      precioVentaConector,
      totalFacturaOriginal,
      comisionServicio,
      gastosExtraTotales,
      porcentajeConectores,
      gastosConectores,
      costoTotalConectores,
      costoUnitarioConector,
      ingresoTotalConectores,
      ingresosTotalesGlobales,
      gananciaBrutaPorConector,
      gananciaBrutaTotalConectores,
      gananciaBrutaGlobal,
      margenConector,
      fechaCreacion: fechaIso,
      ultimaActualizacion: fechaIso
    };

    // 8. Persistencia secuencial en DynamoDB mediante el ProductService
    await dynamoService.createProduct(itemLed);
    await dynamoService.createProduct(itemConector);

    // 9. Retornar respuesta exitosa adjuntando el payload calculado para auditoría
    return response(201, {
      message: "Productos importados y guardados exitosamente",
      productos_registrados: [itemLed, itemConector]
    });

  } catch (error) {
    console.error("Error al procesar la importación en DynamoDB:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return response(500, {
      message: "Error interno del servidor al registrar productos",
      error: errorMessage,
    });
  }
};

const response = (statusCode: number, body: object): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};

const redondearADosDecimales = (numero:any) => {
  return Math.round(numero * 100) / 100;
};