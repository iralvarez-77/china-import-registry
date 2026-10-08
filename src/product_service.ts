/** @format */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand, QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput
} from "@aws-sdk/lib-dynamodb";

export interface Product {
  id: string;
  nombre?: string;
  facturaLed?: number
  facturaConectores?: number
  metrosLed?: number
  metrosPorRollo?: number
  cantidadConectores?: number
  seguro?: number
  envioBarco?: number
  totalPagadoServicio?: number
  precioVentaRollo?: number
  precioVentaConector?: number
  totalFacturaOriginal?: number
  comisionServicio?: number
  gastosExtraTotales?: number
  porcentajeLed?: number
  porcentajeConectores?: number
  gastosLed?: number
  gastosConectores?: number
  costoTotalLed?: number
  costoTotalConectores?: number
  totalRollos?: number
  costoUnitarioRollo?: number
  costoUnitarioConector?: number
  ingresoTotalLed?: number
  ingresoTotalConectores?: number
  ingresosTotalesGlobales?: number
  gananciaBrutaPorRollo?: number
  gananciaBrutaPorConector?: number
  gananciaBrutaTotalLed?: number
  gananciaBrutaTotalConectores?: number
  gananciaBrutaGlobal?: number
  margenLed?: number
  margenConector?: number
  fechaCreacion?: string
  ultimaActualizacion?: string
}

export class ProductService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async createProduct(item: Product): Promise<void> {
    const input: PutCommandInput = {
      TableName: this.tableName,
      Item: item,
      //ConditionExpression: "attribute_not_exists(SK)",
    };
    try {
      await this.docClient.send(new PutCommand(input));
    } catch (error) {
      console.error("createProduct method:", error);
      throw error;
    }

  }

  // async getProducts(nombreComercio: string): Promise<Product[]> {

  //   const tenantId = `TENANT#${nombreComercio}`;
  //   const input: QueryCommandInput = {
  //     TableName: this.tableName,
  //     KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
  //     ExpressionAttributeValues: {
  //     ":pk": tenantId,
  //     ":skPrefix": "PROD#", // Asegura que solo traiga productos y no otras entidades
  //   },
  //   };
  //   try {
  //     const response = await this.docClient.send(new QueryCommand(input));
  //     return (response.Items as Product[]) ?? [];
  //   } catch (error) {
  //     console.error("getProducts:", error);
  //     throw error;
  //   }

  // }

  async getProductById(id: string): Promise<Product | null> {

    const input: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        id: id
      }
    };

    try {
      const response = await this.docClient.send(new GetCommand(input));
      return (response.Item as Product) ?? null;
    } catch (error) {
      console.error("getProductById:", error);
      throw error;
    }
  }
  
  // async updateProductcost(nombre_comercio: string,
  //   codigo_barras: string,
  //   nuevo_costo_usd: number,
  //   nuevo_precio_venta_usd: number): Promise<Product> {
  //   const pk = `TENANT#${nombre_comercio.toLowerCase().replace(/\s+/g, '_')}`;
  //   const sk = `PROD#${codigo_barras}`;

  //   const input: UpdateCommandInput = {
  //       TableName: this.tableName,
  //       Key: {
  //         PK: pk,
  //         SK: sk
  //       },
  //       UpdateExpression: "SET costo_usd = :nc, precio_venta_usd = :np, ultima_actualizacion = :ua",
  //       ExpressionAttributeValues: {
  //         ":nc": nuevo_costo_usd,
  //         ":np": nuevo_precio_venta_usd,
  //         ":ua": new Date().toISOString()
  //       },
  //       ReturnValues: "ALL_NEW" 
  //     };

  //   try {
  //     const response = await this.docClient.send(new UpdateCommand(input));
  //     return response.Attributes as Product;
      
  //   } catch (error) {
  //     console.error("updateProductcost", error);
  //     throw error;
  //   }

  // }

  // async listProductsCritics(): Promise<Product[]> {

  //   const input: QueryCommandInput = {
  //     TableName: this.tableName,
  //     IndexName: this.indexName,
  //     KeyConditionExpression: '#es = :estado',
  //     ExpressionAttributeNames: { '#es': 'estado_stock' },
  //     ExpressionAttributeValues: { ':estado': 'CRITICO' }
  //   };
  //   try {
  //     const response = await this.docClient.send(new QueryCommand(input));
  //     return (response.Items as Product[]) ?? [];
  //   } catch (error) {
  //     console.error("listProductsCritics", error);
  //     throw error;
  //   }

  // }
}

export default ProductService;

