/**
 * Auth0 FGA Authorization Model
 *
 * This defines the authorization model for the treasury management system.
 * The model must be created in Auth0 FGA before relationship tuples can be written.
 *
 * To apply this model:
 * 1. Go to: https://dashboard.fga.dev
 * 2. Select your store
 * 3. Create a new authorization model
 * 4. Paste the DSL below
 */

export const authorizationModelDSL = `
model
  schema 1.1

type user

type payroll
  relations
    define owner: [user]
    define viewer: [user] or owner
    define manager: [user]
    define can_view: viewer or manager

type department
  relations
    define manager: [user]
    define member: [user]
    define can_view_payroll: manager

type transfer
  relations
    define executor: [user]
    define approver: [user]
    define can_execute: executor

type document
  relations
    define owner: [user]
    define viewer: [user] or owner
    define can_read: viewer
`;

/**
 * Example relationship tuples for the authorization model
 *
 * These define who can do what:
 */
export const exampleTuples = [
  // Morty can view his own payroll (EMP006)
  {
    user: 'user:auth0|morty',
    relation: 'viewer',
    object: 'payroll:EMP006',
  },

  // Alice is a manager of the Treasury department
  {
    user: 'user:auth0|alice',
    relation: 'manager',
    object: 'department:treasury',
  },

  // Alice can execute transfers (treasury manager privilege)
  {
    user: 'user:auth0|alice',
    relation: 'executor',
    object: 'transfer:bank',
  },

  // Carol is a manager of Finance department
  {
    user: 'user:auth0|carol',
    relation: 'manager',
    object: 'department:finance',
  },

  // Morty is a member of Finance department
  {
    user: 'user:auth0|morty',
    relation: 'member',
    object: 'department:finance',
  },

  // Alice can view all treasury employees' payroll
  {
    user: 'user:auth0|alice',
    relation: 'manager',
    object: 'payroll:EMP001',
  },
  {
    user: 'user:auth0|alice',
    relation: 'manager',
    object: 'payroll:EMP002',
  },
];

/**
 * Authorization model in JSON format (for SDK)
 */
export const authorizationModelJSON = {
  schema_version: '1.1',
  type_definitions: [
    {
      type: 'user',
      relations: {},
    },
    {
      type: 'payroll',
      relations: {
        owner: {
          this: {},
        },
        viewer: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  relation: 'owner',
                },
              },
            ],
          },
        },
        manager: {
          this: {},
        },
        can_view: {
          union: {
            child: [
              {
                computedUserset: {
                  relation: 'viewer',
                },
              },
              {
                computedUserset: {
                  relation: 'manager',
                },
              },
            ],
          },
        },
      },
    },
    {
      type: 'department',
      relations: {
        manager: {
          this: {},
        },
        member: {
          this: {},
        },
        can_view_payroll: {
          computedUserset: {
            relation: 'manager',
          },
        },
      },
    },
    {
      type: 'transfer',
      relations: {
        executor: {
          this: {},
        },
        approver: {
          this: {},
        },
        can_execute: {
          computedUserset: {
            relation: 'executor',
          },
        },
      },
    },
    {
      type: 'document',
      relations: {
        owner: {
          this: {},
        },
        viewer: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  relation: 'owner',
                },
              },
            ],
          },
        },
        can_read: {
          computedUserset: {
            relation: 'viewer',
          },
        },
      },
    },
  ],
};

/**
 * Instructions for setting up the authorization model
 */
export const setupInstructions = `
# Auth0 FGA Authorization Model Setup

## Option 1: Using the FGA Dashboard (Recommended for Demo)

1. Go to https://dashboard.fga.dev
2. Log in with your Auth0 credentials
3. Select your store: ${process.env.FGA_STORE_ID}
4. Click "Authorization Models" → "Create New Model"
5. Copy and paste the DSL from authorizationModelDSL
6. Click "Save Model"

## Option 2: Using the SDK (Programmatic)

We can also write the model programmatically using the OpenFGA SDK.
This would be done in a migration script or setup tool.

## After Creating the Model

Once the model is created, we need to write relationship tuples that define
who can access what. These tuples are in the exampleTuples array above.

You can write these tuples using:
- The FGA Dashboard (UI)
- The FGA API
- Our setupFGATuples.ts script
`;
