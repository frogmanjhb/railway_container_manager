import { gql } from '@apollo/client';

// Railway GraphQL Queries and Mutations
export const GET_DEPLOYMENT_STATUS = gql`
  query GetDeploymentStatus($projectId: String!, $serviceId: String!) {
    project(id: $projectId) {
      id
      name
      services {
        id
        name
        deployments {
          id
          status
          createdAt
        }
      }
    }
  }
`;

export const CREATE_DEPLOYMENT = gql`
  mutation CreateDeployment($input: DeploymentCreateInput!) {
    deploymentCreate(input: $input) {
      id
      status
      createdAt
    }
  }
`;

export const DELETE_DEPLOYMENT = gql`
  mutation DeleteDeployment($id: String!) {
    deploymentDelete(id: $id) {
      success
    }
  }
`;

export const GET_SERVICE_STATUS = gql`
  query GetServiceStatus($serviceId: String!) {
    service(id: $serviceId) {
      id
      name
      status
      deployments {
        id
        status
        createdAt
      }
    }
  }
`;

// Types for our GraphQL operations
export interface DeploymentStatus {
  id: string;
  status: 'DEPLOYING' | 'DEPLOYED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  status: string;
  deployments: DeploymentStatus[];
}

export interface Project {
  id: string;
  name: string;
  services: Service[];
}
