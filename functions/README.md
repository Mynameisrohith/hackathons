
# Email Notification Setup

To enable email notifications, you need to configure environment variables for the email service.

1.  **Create a `.env` file** inside this `functions` directory.
2.  **Add the following variables** to the `.env` file, replacing the placeholder values:

    ```
    NODEMAILER_USER="your-gmail-address@gmail.com"
    NODEMAILER_PASS="your-gmail-app-password"
    NODEMAILER_ADMIN="your-admin-email@example.com"
    ```

3.  **Use a Gmail "App Password"** for `NODEMAILER_PASS`, not your regular password. You can generate one at [Google App Passwords](https://myaccount.google.com/apppasswords).

4.  **Deploy Functions**: When you deploy, these variables will be used to configure the email service securely. The function code is written to automatically use these variables when you deploy using the Firebase CLI.

    ```bash
    # Set the configuration in your Firebase project
    firebase functions:config:set nodemailer.user="your-gmail-address@gmail.com"
    firebase functions:config:set nodemailer.pass="your-gmail-app-password"
    firebase functions:config:set nodemailer.admin="your-admin-email@example.com"

    # Deploy the functions
    firebase deploy --only functions
    ```
