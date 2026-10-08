/** @format */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import ProductService, { Product } from "../../src/product_service";

const TABLE_NAME = process.env.TABLE_NAME ?? "";
const dynamoService = new ProductService(TABLE_NAME);


export const updateCostFunction = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("👀 👉🏽 ~  context:", context);
  console.log("👀 👉🏽 ~  event:", event);

  const bodyEvent = (typeof event.body === 'string' 
    ? JSON.parse(event.body) 
    : event.body)

  try {
    const { id_led, id_conector, nuevo_costo_led, nuevo_costo_conector} = bodyEvent

    const led = await dynamoService.getProductById(id_led);
    if (!led) {
      return response(404, { message: `El producto LED con ID ${id_led} no fue encontrado.` });
    }
    const { margenLed = 0, nombre:nombreLed, costoUnitarioRollo = 0 } = led

    const precio_venta_led = Math.round((nuevo_costo_led * (1 + margenLed / 100)) * 100) / 100;
    

    const conector = await dynamoService.getProductById(id_conector);
    if (!conector) {
      return response(404, { message: `El producto LED con ID ${id_conector} no fue encontrado.` });
    }
    const { margenConector = 0, nombre: nombreConect, costoUnitarioConector = 0 } = conector

    const precio_venta_conect = Math.round((nuevo_costo_conector * (1 + margenConector / 100)) * 100) / 100;

    const hubo_incremento_led = nuevo_costo_led > costoUnitarioRollo;
    let alerta_led = null;
    const hubo_incremento_conect = nuevo_costo_conector > costoUnitarioConector;
    let alerta_conect = null;

    if (hubo_incremento_led) {
      alerta_led = {
        tipo: 'COSTO_REPOSICION_INCREMENTADO',
        mensaje: `¡Alerta de Reposición! El costo de "${nombreLed}" subió de $${costoUnitarioRollo} a $${nuevo_costo_led}. El precio de venta sugerido es de ${precio_venta_led} y se ajustó automáticamente para proteger tu margen del ${margenLed}%.`
      };
    }
    if (hubo_incremento_conect) {
      alerta_led = {
        tipo: 'COSTO_REPOSICION_INCREMENTADO',
        mensaje: `¡Alerta de Reposición! El costo de "${nombreConect}" subió de $${costoUnitarioConector} a $${nuevo_costo_conector}. El precio de venta sugerido es de ${precio_venta_conect} y se ajustó automáticamente para proteger tu margen del ${margenConector}%.`
      };
    }
    // 9. Retornar respuesta exitosa adjuntando el payload calculado para auditoría
    return response(200, {
      message: "He obtenido el producto con éxito",
      productos: [led, conector],
      alertas: [alerta_led, alerta_conect].filter(alerta => alerta !== null)
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