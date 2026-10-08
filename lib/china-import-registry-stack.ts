import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
export class ChinaImportRegistryStack extends cdk.Stack {
  public readonly landedCostCalculatorFunction: lambdaNodejs.NodejsFunction;
  public readonly updateCostFunction: lambdaNodejs.NodejsFunction;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importProductsTable = new dynamo.Table(this, 'ImportProductsTable', {
      tableName: "ImportProductsTable",
      partitionKey: { name: 'id', type: dynamo.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
    });
    
    this.landedCostCalculatorFunction = new lambdaNodejs.NodejsFunction(this,         'LandedCostCalculatorFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/landed_cost_calculator/index.ts',
      handler: 'landedCostCalculatorFunction', 
      environment: {
          TABLE_NAME: importProductsTable.tableName,
      },
    });

    this.updateCostFunction = new lambdaNodejs.NodejsFunction(this,         'UpdateCostFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: 'lambda/update_cost/index.ts',
      handler: 'updateCostFunction', 
      environment: {
          TABLE_NAME: importProductsTable.tableName,
      },
    });

    importProductsTable.grantWriteData(this.landedCostCalculatorFunction);
    importProductsTable.grantReadWriteData(this.updateCostFunction);

    const importProductsAPI = new apigw.RestApi(this, 'ImportProductsApi');
    const integrationLandedcost = new apigw.LambdaIntegration(this.landedCostCalculatorFunction);
    const integrationUpdateCost = new apigw.LambdaIntegration(this.updateCostFunction);
    const products = importProductsAPI.root.addResource('products');
    products.addMethod('POST', integrationLandedcost); 
    products.addMethod('PUT', integrationUpdateCost); 

  }
}
