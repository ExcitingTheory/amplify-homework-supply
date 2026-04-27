import { defineFunction } from '@aws-amplify/backend';
import { Construct } from 'constructs';
import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { WebSocketApi, WebSocketStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { IFunction } from 'aws-cdk-lib/aws-lambda';


export interface WebSocketApiProps {
  unitTable: ITable;
  homeworkRoomTable: ITable;
  websocketLambda: IFunction;
}


export const websocketHandler = defineFunction({
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'data',  // Keep in data stack with WebSocket construct
});

/**
 * WebSocket API for real-time Yjs collaboration
 * 
 * Creates:
 * - WebSocket API Gateway with $connect, $disconnect, $default routes
 * - DynamoDB table for connection tracking with UnitIdIndex GSI
 * - IAM permissions for Lambda to access tables and manage connections
 */
export class WebSocketApiConstruct extends Construct {
  public readonly api: WebSocketApi;
  public readonly stage: WebSocketStage;
  public readonly connectionsTable: Table;

  constructor(scope: Construct, id: string, props: WebSocketApiProps) {
    super(scope, id);

    const { unitTable, homeworkRoomTable, websocketLambda } = props;

    // DynamoDB table for WebSocket connections
    // Tracks which connections are editing which units
    this.connectionsTable = new Table(this, 'WebSocketConnections', {
      partitionKey: {
        name: 'connectionId',
        type: AttributeType.STRING,
      },
      // Let CDK auto-generate table name to avoid conflicts
      // tableName: 'WebSocketConnections',
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // Use RETAIN for production
      timeToLiveAttribute: 'ttl', // Auto-cleanup stale connections
    });

    // GSI for querying all connections by unitId (for broadcasting)
    this.connectionsTable.addGlobalSecondaryIndex({
      indexName: 'UnitIdIndex',
      partitionKey: {
        name: 'unitId',
        type: AttributeType.STRING,
      },
    });

    // Grant Lambda access to connections table
    this.connectionsTable.grantReadWriteData(websocketLambda);

    // Grant Lambda access to Amplify Data for persisting Yjs snapshots
    unitTable.grantReadWriteData(websocketLambda);

    // Grant Lambda read access to HomeworkRoom for review room authorization
    homeworkRoomTable.grantReadData(websocketLambda);

    // WebSocket API
    this.api = new WebSocketApi(this, 'CollaborationWebSocketApi', {
      apiName: 'homeworkSupplyCollaborationApi',
      description: 'Real-time Yjs collaboration WebSocket API',
    });

    // WebSocket Lambda integration
    const wsIntegration = new WebSocketLambdaIntegration(
      'WebSocketIntegration',
      websocketLambda
    );

    // WebSocket routes
    this.api.addRoute('$connect', {
      integration: wsIntegration,
    });

    this.api.addRoute('$disconnect', {
      integration: wsIntegration,
    });

    this.api.addRoute('$default', {
      integration: wsIntegration,
    });

    // Create production stage
    this.stage = new WebSocketStage(this, 'ProdStage', {
      webSocketApi: this.api,
      stageName: 'live',
      autoDeploy: true,
    });

    // Grant Lambda permission to send messages back to connected clients
    websocketLambda.grantPrincipal?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${Stack.of(this).region}:${Stack.of(this).account}:${this.api.apiId}/${this.stage.stageName}/*`,
        ],
      })
    );
  }
}
