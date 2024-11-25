# sls-ssm-knex-config-ssm

This repository demonstrates a secure configuration system using AWS Systems Manager (SSM) Parameter Store to manage and dynamically rotate database credentials for a Node.js application configured with Knex.js. It uses a modular architecture to facilitate scalability and maintainability.

## Overview

This project integrates AWS SSM Parameter Store with Knex.js, focusing on:

- Securely storing and retrieving database credentials.
- Dynamically rotating credentials using an `activeUser` flag and timestamp logic.
- Providing a structured and extendable handler-based architecture for database operations.

### SSM Parameters

**1. `activeUser`**  
Indicates the current active user for database access, including rotation details.  
Example:

```json
{
  "activeUser": "one",
  "timestamp": 1725329489810,
  "rotatedAt": "2024-09-03T02:11:29.810Z",
  "rotatedAtUTC": "2024-09-03T02:11:29.810Z",
  "becomesLiveAt": "2024-09-03T03:41:29.810Z"
}
```

**2. User Parameters (`one`, `two`)**  
Contains detailed database credentials.  
Example:

```json
{
  "username": "user_one",
  "password": "xxxxxxxx",
  "engine": "mysql",
  "host": "develop.xxxxxxxx.eu-west-2.rds.amazonaws.com",
  "port": 3306,
  "dbInstanceIdentifier": "develop",
  "proxy": "develop.proxy-xxxxxxxx.eu-west-2.rds.amazonaws.com"
}
```

## Features

- Securely fetch database credentials from SSM Parameter Store.
- Dynamically update the database connection configuration based on the active user.
- Provide extendable base handlers for streamlined database interactions.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed.
- **AWS CLI**: Install and configure the AWS CLI with credentials that have access to the SSM Parameter Store.
- **Knex.js**: Used for database interaction.
- **MySQL Database**: Ensure a MySQL database instance is available and accessible.

## Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/dave421/sls-ssm-knex-config-ssm.git
   cd sls-ssm-knex-config-ssm
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up SSM Parameters**:

   - Add an `activeUser` parameter:
     ```bash
     aws ssm put-parameter --name "/myapp/activeUser" --value '{"activeUser":"one","timestamp":1725329489810,"rotatedAt":"2024-09-03T02:11:29.810Z","rotatedAtUTC":"2024-09-03T02:11:29.810Z","becomesLiveAt":"2024-09-03T03:41:29.810Z"}' --type String
     ```
   - Add database credentials for `one` and `two`:
     ```bash
     aws ssm put-parameter --name "/myapp/one" --value '{"username": "user_one", "password": "xxxxxxxx", "engine": "mysql", "host": "develop.xxxxxxxx.eu-west-2.rds.amazonaws.com", "port": 3306, "dbInstanceIdentifier": "develop", "proxy": "develop.proxy-xxxxxxxx.eu-west-2.rds.amazonaws.com"}' --type SecureString
     aws ssm put-parameter --name "/myapp/two" --value '{"username": "user_two", "password": "yyyyyyyy", "engine": "mysql", "host": "develop.xxxxxxxx.eu-west-2.rds.amazonaws.com", "port": 3306, "dbInstanceIdentifier": "develop", "proxy": "develop.proxy-xxxxxxxx.eu-west-2.rds.amazonaws.com"}' --type SecureString
     ```

4. **Environment Variables**:
   Create a `.env` file with the following content:

   ```
   AWS_REGION=your-region
   SSM_PARAMETER_PATH=/myapp/
   ```

5. **IAM Permissions**:
   Ensure the IAM role or credentials used by the application have the necessary permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["ssm:GetParameter", "ssm:GetParameters"],
         "Resource": "arn:aws:ssm:your-region:your-account-id:parameter/*"
       }
     ]
   }
   ```

## Usage

- **Run the Application**:

  ```bash
  npm start
  ```

- **Workflow**:
  - The application fetches the `activeUser` parameter to determine which user credentials to use.
  - It retrieves the corresponding credentials from SSM.
  - Knex.js is dynamically configured with these credentials to establish a secure database connection.

## Project Structure

```
.
├── src
│   ├── knexfile.ts             # Knex.js configuration
│   ├── contracts/              # Project interfaces
│   ├── formatters/             # Response formatters
│   └── handlers/
│       ├── mainHandler.ts      # Extends KnexHandler
│       ├── KnexHandler.ts      # Extends BaseHandler
│       └── baseHandler.ts      # Base handler logic
├── .gitignore                  # Specifies files and directories to ignore
├── package.json                # Project metadata
├── package-lock.json           # Dependency tree
├── LICENSE                     # Licensing information
└── README.md                   # Documentation
```

## Key Files

- **`src/knexfile.ts`**: Configures Knex.js to use database credentials retrieved from SSM.
- **`src/contracts/`**: Contains TypeScript interfaces for structuring project data.
- **`src/formatters/`**: Includes logic for formatting API responses.
- **`src/handlers/baseHandler.ts`**: A reusable base handler for extending functionality.
- **`src/handlers/KnexHandler.ts`**: Extends the base handler to include Knex.js-specific logic.
- **`src/handlers/mainHandler.ts`**: The primary handler that extends KnexHandler.

## References

- [Knex.js Documentation](https://knexjs.org/)
- [AWS SSM Parameter Store Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS SDK for JavaScript Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
