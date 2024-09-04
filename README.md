# Typper BI

We believe in empowering businesses with an **AI-enhanced approach to data insights** that integrates seamlessly with your existing SaaS tools. Our vision is to offer a powerful, yet user-friendly, BI platform that transforms how data-driven decisions are made. Typper BI supports a wide array of integrations, from SaaS applications to data warehouses and lakes.

## 📄 Documentation

[here](https://docs.bi.typper.io/introduction)

## 🚀 Features

- **Query your database with natural language**: Schedule events simply by typing or speaking in natural language.
- **Get help with SQL**: Use ChatGPT integration to receive intelligent suggestions and automate meeting and event scheduling.
- **Create dashboards**: AI-powered features to automatically adjust your calendar events when necessary (coming soon).
- **Create reports**: Share your calendar with anyone, making it easier to coordinate schedules and commitments (coming soon).

## 📦 Installation

Follow the steps below to set up the project locally.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/typper-io/typper-bi.git
   cd typper-bi
   ```

2. **Run docker compose:**

   ```bash
   docker compose up
   ```

3. **Deploy migrations with prisma**

   ```bash
   cd server
   npx prisma migrate deploy
   ```

4. Access

   - **Client**: [http://localhost:3000](http://localhost:3000)

## 🛠️ Technologies Used

For client:

- **Next.js**: A React framework for building modern, high-performance web applications.
- **React**: A JavaScript library for building user interfaces.
- **CSS Modules/TailwindCSS**: For styling the interface.

For server:

- **NestJS**: A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **OpenAI GPT**: Integration with OpenAI's GPT API for AI-powered assistance.
- **Google OAuth**: For user authentication and authorization.
- **PostgreSQL**: A powerful, open-source object-relational database system.

## 🔧 Environment Variables

The project uses environment variables to store sensitive information and configuration settings. You need to set up the following environment variables to run the application successfully.

### NEXTAUTH_SECRET

- **Purpose:** A secret key used by NextAuth.js to sign and encrypt JWT tokens, ensuring the security of authentication tokens in the application.

### GOOGLE_CLIENT_ID

- **Purpose:** The client ID for integrating Google OAuth in your application, allowing users to authenticate using their Google account.

### GOOGLE_CLIENT_SECRET

- **Purpose:** The client secret associated with the Google Client ID, used in the OAuth flow to securely obtain access tokens.

### NODE_ENV

- **Purpose:** Specifies the environment in which the application is running, such as `development`, `production`, or `test`. This variable helps the application adjust its behavior accordingly.

### NEXT_PUBLIC_SERVICE_ACCOUNT_EMAIL

- **Purpose:** The email address of the Google Cloud Service Account, often used for accessing Google APIs, such as Google Sheets or Google Drive.

### DATABASE_URL

- **Purpose:** The connection string used to connect to your database. It typically includes the type of database, hostname, port, username, password, and database name.

### SECRET_AWS_ACCESS_KEY

- **Purpose:** The AWS access key used for programmatic access to AWS services, part of the AWS credentials.

### SECRET_AWS_SECRET_KEY

- **Purpose:** The AWS secret access key, which works alongside the AWS access key to authenticate and authorize requests to AWS services.

### JWT_SECRET

- **Purpose:** A secret key used for signing and verifying JSON Web Tokens (JWTs), ensuring the integrity and authenticity of the tokens.

### GOOGLE_CREDENTIALS

- **Purpose:** The JSON string containing Google service account credentials, used for authenticating and accessing Google Cloud APIs.

### API_KEY

- **Purpose:** A generic API key used to authenticate requests to third-party services or internal APIs.

### RESEND_API_KEY

- **Purpose:** API key for the Resend service, which is used for sending emails or notifications through an external email service.

### ENCRYPTION_KEY

- **Purpose:** The key used to encrypt sensitive data in the application, ensuring that data is stored securely.

### IV

- **Purpose:** The initialization vector used in conjunction with the encryption key to encrypt data. It adds randomness to the encryption process, making it more secure.

### ANTHROPIC_API_KEY

- **Purpose:** The API key for accessing Anthropic’s services, which may include AI or machine learning APIs.

### EMAIL_DOMAIN

- **Purpose:** The domain used for sending emails from the application. This is often used to set the "from" address in email communications.

### APP_DOMAIN

- **Purpose:** The domain where your application is hosted. It’s used to configure various services like authentication, cookies, and redirects.

### DATASOURCE_S3_BUCKET_NAME

- **Purpose:** The name of the S3 bucket where your application’s data sources are stored, often used for file storage and retrieval.

### WORKSPACE_IMAGES_BUCKET_NAME

- **Purpose:** The name of the S3 bucket where images related to your application’s workspace are stored, typically used for user-uploaded content.

### AWS_SSM_SECRET_PREFIX

- **Purpose:** The prefix used in AWS Systems Manager (SSM) to organize and retrieve secrets from the Parameter Store.

### DEMO_ASSISTANT_ID

- **Purpose:** The identifier for a demo assistant, likely used in applications where an AI or assistant feature is demonstrated.

## 🤖 Setting Up the OpenAI Assistant

This project includes an OpenAI Assistant that helps automate and manage your calendar through natural language. Follow the steps below to create and integrate the assistant:

1. **Create an Assistant on the OpenAI Platform:**

   - Visit the [OpenAI Assistants](https://platform.openai.com/assistants) page.
   - Click on "Create Assistant."
   - Fill in the details such as the name, description, and abilities of your assistant.
   - Ensure you enable the ability to run code within the assistant's settings.
   - Save the Assistant and copy the `ASSISTANT_ID`.

2. **Add the Assistant ID to Environment Variables:**

   - Open your `.env.local` file.
   - Add the `ASSISTANT_ID` you just copied.

   ```bash
   ASSISTANT_ID=your-assistant-id
   ```

3. **Configure the Assistant with Functions and Instructions:**

   The JSON files and the instruction file you need to use for configuring the assistant are located in the `assistant/functions/` directory and in the `assistant/instruction.txt` file. Follow these steps to set them up:

   - **Load Functions:**

     - In the assistant configuration panel on OpenAI, find the section where you can add custom functions.
     - Upload the functions files located in the `functions/` directory.

   - **Add Instructions:**

     - In the same panel, there will be an area to add instructions to the assistant.
     - Copy the content of the `instruction.txt` file and paste it into the instruction area. These instructions will guide the assistant's behavior and how it should use the available functions.

## 📄 License

This project is licensed under the [MIT License](./LICENSE.md).

## 🤝 Contributions

Contributions are welcome! Feel free to open issues or pull requests to suggest improvements or fix issues.

## 📧 Contact

For more information or support, contact [contact@typper.io](mailto:contact@typper.io).
